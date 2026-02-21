#!/usr/bin/env python3
"""
Backfill script to regenerate map data for all existing trip summaries.
This script fetches all trips from DynamoDB, retrieves their telemetry events,
generates map data, and updates the trip summary records.
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

import boto3

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get environment variables with defaults
REGION = os.environ.get('AWS_REGION', 'us-east-1')
TRIP_SUMMARY_TABLE = os.environ.get('TRIP_SUMMARY_TABLE', 'onpoint-dev-trip-summary')
TELEMETRY_EVENTS_TABLE = os.environ.get('TELEMETRY_EVENTS_TABLE', 'onpoint-dev-telemetry-events')

ddb = boto3.client('dynamodb', region_name=REGION)


def _iso_now() -> str:
    """Return current UTC time in clean ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"""
    return datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


def _parse_iso(ts: str) -> Optional[datetime]:
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except Exception:
        return None


def _ddb_unmarshal_item(it: Dict[str, Any]) -> dict:
    """Convert DynamoDB format to regular Python dict"""
    result = {}
    for k, v_dict in it.items():
        if isinstance(v_dict, dict):
            if "S" in v_dict:
                result[k] = v_dict["S"]
            elif "N" in v_dict:
                try:
                    result[k] = float(Decimal(v_dict["N"]))
                except Exception:
                    result[k] = v_dict["N"]
            elif "M" in v_dict:
                result[k] = _ddb_unmarshal_item(v_dict["M"])
            elif "L" in v_dict:
                result[k] = [_ddb_unmarshal_item({"x": item}) for item in v_dict["L"]]
                result[k] = [item.get("x") for item in result[k]]
            elif "BOOL" in v_dict:
                result[k] = v_dict["BOOL"]
            elif "NULL" in v_dict:
                result[k] = None
            else:
                result[k] = v_dict
        else:
            result[k] = v_dict
    return result


def _ddb_marshal_item(item: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Python dict to DynamoDB format"""
    def marshal_value(v):
        if v is None:
            return {"NULL": True}
        elif isinstance(v, bool):
            return {"BOOL": v}
        elif isinstance(v, (int, float)):
            return {"N": str(v)}
        elif isinstance(v, str):
            return {"S": v}
        elif isinstance(v, dict):
            return {"M": {k: marshal_value(val) for k, val in v.items()}}
        elif isinstance(v, list):
            return {"L": [marshal_value(item) for item in v]}
        else:
            return {"S": str(v)}
    
    result = {}
    for k, v in item.items():
        result[k] = marshal_value(v)
    return result


def _fetch_events(pk: str) -> List[dict]:
    """Fetch all events for a trip from DynamoDB"""
    items = []
    last_key = None
    
    while True:
        params = {
            "TableName": TELEMETRY_EVENTS_TABLE,
            "KeyConditionExpression": "PK = :pk",
            "ExpressionAttributeValues": {":pk": {"S": pk}},
        }
        
        if last_key:
            params["ExclusiveStartKey"] = last_key
        
        try:
            resp = ddb.query(**params)
            for it in resp.get("Items", []):
                items.append(_ddb_unmarshal_item(it))
            
            last_key = resp.get("LastEvaluatedKey")
            if not last_key:
                break
        except Exception as e:
            logger.error(f"Error fetching events for {pk}: {e}")
            break
    
    return items


def _convert_event(it: dict) -> dict:
    """Convert raw DynamoDB event to standard format"""
    # Map eventTime to dt for timestamp compatibility
    timestamp = it.get("eventTime") or it.get("dt") or it.get("timestamp")
    return {
        "dt": timestamp,
        "lat": it.get("lat"),
        "lon": it.get("lon"),
        "speed": it.get("speed") or it.get("speed_mph"),
        "accel": it.get("accel"),
        "decel": it.get("decel"),
        "overspeed": it.get("overspeed", 0),
        "harshEvent": it.get("harshEvent"),
        "dtcActive": it.get("dtcActive"),
    }


def _sample_coordinates(events: List[Dict[str, Any]], max_points: int = 150) -> List[List[float]]:
    """Sample coordinates from events, return as [[lat, lon], ...]"""
    coords = []
    for e in events:
        lat = e.get("lat")
        lon = e.get("lon")
        if lat is not None and lon is not None:
            coords.append([float(lat), float(lon)])
    
    if len(coords) <= max_points:
        return coords
    
    # Downsample
    step = len(coords) / max_points
    sampled = [coords[int(i * step)] for i in range(max_points)]
    if coords[-1] != sampled[-1]:
        sampled.append(coords[-1])
    return sampled


def _extract_event_markers(events: List[Dict[str, Any]]) -> List[dict]:
    """Extract significant events with location for map markers"""
    markers = []
    
    for e in events:
        # Check for significant events
        if not (e.get("harshEvent") or e.get("overspeed") or e.get("dtcActive")):
            continue
        
        lat = e.get("lat")
        lon = e.get("lon")
        dt = e.get("dt")
        
        if not (lat and lon and dt):
            continue
        
        marker_type = None
        if e.get("harshEvent"):
            marker_type = "harsh"
        elif e.get("overspeed"):
            marker_type = "overspeed"
        elif e.get("dtcActive"):
            marker_type = "dtc"
        
        if marker_type:
            markers.append({
                "type": marker_type,
                "lat": float(lat),
                "lon": float(lon),
                "timestamp": dt
            })
    
    return markers


def _generate_map_data(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Generate complete map data from events"""
    if not events:
        return {
            "sampledPath": [],
            "snappedPath": None,
            "startCoords": None,
            "endCoords": None,
            "bounds": None,
            "eventMarkers": [],
            "generatedAt": _iso_now()
        }
    
    # Sample coordinates
    sampled = _sample_coordinates(events, max_points=150)
    
    # Get start and end coordinates
    start_coords = sampled[0] if sampled else None
    end_coords = sampled[-1] if sampled else None
    
    # Calculate bounds
    bounds = None
    if sampled:
        lats = [coord[0] for coord in sampled]
        lons = [coord[1] for coord in sampled]
        bounds = {
            "minLat": min(lats),
            "maxLat": max(lats),
            "minLon": min(lons),
            "maxLon": max(lons)
        }
    
    # Extract event markers
    markers = _extract_event_markers(events)
    
    return {
        "sampledPath": sampled,
        "snappedPath": None,  # OSRM calls skipped in backfill for speed
        "startCoords": start_coords,
        "endCoords": end_coords,
        "bounds": bounds,
        "eventMarkers": markers,
        "generatedAt": _iso_now()
    }


def _scan_trip_summaries() -> List[tuple]:
    """Scan all trips from DynamoDB trip summary table"""
    trips = []
    last_key = None
    
    while True:
        params = {
            "TableName": TRIP_SUMMARY_TABLE,
        }
        
        if last_key:
            params["ExclusiveStartKey"] = last_key
        
        try:
            resp = ddb.scan(**params)
            for it in resp.get("Items", []):
                trip = _ddb_unmarshal_item(it)
                vin = trip.get("vin")
                trip_id = trip.get("tripId")
                if vin and trip_id:
                    trips.append((vin, trip_id, trip))
            
            last_key = resp.get("LastEvaluatedKey")
            if not last_key:
                break
        except Exception as e:
            logger.error(f"Error scanning trip summary table: {e}")
            break
    
    return trips


def _update_trip_summary_with_map(vin: str, trip_id: str, summary: dict, map_data: dict) -> bool:
    """Update trip summary with new map data"""
    try:
        pk = f"VEHICLE#{vin}"
        sk = f"TRIP_SUMMARY#{trip_id}"
        
        # Fetch the existing item first
        resp = ddb.get_item(
            TableName=TRIP_SUMMARY_TABLE,
            Key={"PK": {"S": pk}, "SK": {"S": sk}}
        )
        
        existing_item = resp.get("Item", {})
        
        # Parse the summary JSON string
        summary_json_str = existing_item.get("summary", {}).get("S", "{}")
        try:
            summary_obj = json.loads(summary_json_str)
        except Exception:
            summary_obj = {}
        
        # Add the map data
        summary_obj["map"] = map_data
        
        # Update the item with the new summary JSON
        existing_item["summary"] = {"S": json.dumps(summary_obj)}
        existing_item["updatedAt"] = {"S": _iso_now()}
        
        ddb.put_item(
            TableName=TRIP_SUMMARY_TABLE,
            Item=existing_item
        )
        
        return True
    except Exception as e:
        logger.error(f"Error updating trip summary {vin}/{trip_id}: {e}")
        return False


def backfill_map_data():
    """Main backfill function"""
    logger.info(f"Starting map data backfill from {TRIP_SUMMARY_TABLE}...")
    
    trips = _scan_trip_summaries()
    logger.info(f"Found {len(trips)} trips to process")
    
    if not trips:
        logger.info("No trips found, exiting")
        return
    
    processed = 0
    updated = 0
    failed = 0
    
    for vin, trip_id, summary in trips:
        processed += 1
        
        logger.info(f"Processing {processed}/{len(trips)}: {vin} / {trip_id}")
        
        # Fetch events
        pk = f"VEHICLE#{vin}#TRIP#{trip_id}"
        items = _fetch_events(pk)
        
        if not items:
            logger.warning(f"  No events found for {vin}/{trip_id}")
            continue
        
        # Convert events
        events = [_convert_event(i) for i in items]
        events = [e for e in events if e.get("dt") is not None]
        
        if not events:
            logger.warning(f"  No parseable events for {vin}/{trip_id}")
            continue
        
        # Generate map data
        map_data = _generate_map_data(events)
        logger.info(f"  Generated map data: {len(map_data.get('sampledPath', []))} sampled points, "
                   f"{len(map_data.get('eventMarkers', []))} event markers")
        
        # Update summary
        if _update_trip_summary_with_map(vin, trip_id, summary, map_data):
            updated += 1
        else:
            failed += 1
    
    logger.info(f"\nBackfill complete:")
    logger.info(f"  Processed: {processed}")
    logger.info(f"  Updated: {updated}")
    logger.info(f"  Failed: {failed}")


if __name__ == "__main__":
    backfill_map_data()
