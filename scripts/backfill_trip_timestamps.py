#!/usr/bin/env python3
"""
Backfill script to normalize timestamps in existing trip summaries.
Converts verbose timestamps (2026-02-03T19:40:11.000000+00:00) to clean format (2026-02-03T19:40:11Z)
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, Any, Optional

import boto3

# Configuration
REGION = os.environ.get("AWS_REGION", "us-east-1")
TABLE_NAME = os.environ.get("TRIP_SUMMARY_TABLE", "onpoint-dev-trip-summary")
BATCH_SIZE = 25  # DynamoDB batch write limit

ddb = boto3.resource("dynamodb", region_name=REGION)
table = ddb.Table(TABLE_NAME)

def normalize_timestamp(ts: Optional[str]) -> Optional[str]:
    """Convert verbose timestamp to clean ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)"""
    if not ts or not isinstance(ts, str):
        return ts
    try:
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    except Exception:
        return ts


def normalize_value(value: Any) -> Any:
    """Recursively normalize all timestamp values in nested structures"""
    if isinstance(value, dict):
        return {k: normalize_value(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [normalize_value(item) for item in value]
    elif isinstance(value, str):
        # Check if looks like a timestamp (ISO format)
        if "T" in value and ("Z" in value or "+" in value):
            return normalize_timestamp(value)
    return value


def normalize_trip_summary(item: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize all timestamps in a trip summary item"""
    # Normalize top-level timestamps
    if "startTime" in item and isinstance(item["startTime"], str):
        item["startTime"] = normalize_timestamp(item["startTime"])
    if "endTime" in item and isinstance(item["endTime"], str):
        item["endTime"] = normalize_timestamp(item["endTime"])
    if "updatedAt" in item and isinstance(item["updatedAt"], str):
        item["updatedAt"] = normalize_timestamp(item["updatedAt"])
    
    # Normalize summary JSON if present
    if "summary" in item:
        summary = item["summary"]
        if isinstance(summary, str):
            try:
                summary = json.loads(summary)
            except Exception:
                return item
        
        if isinstance(summary, dict):
            # Recursively normalize all timestamps in summary
            summary = normalize_value(summary)
            # Store back as string (DynamoDB format)
            item["summary"] = json.dumps(summary, default=str)
    
    return item


def backfill_trips(limit: Optional[int] = None):
    """Scan and backfill all trips with normalized timestamps"""
    print(f"Starting backfill of trip summaries from {TABLE_NAME}...")
    
    scanned = 0
    updated = 0
    failed = 0
    last_key = None
    
    try:
        while True:
            # Scan next batch
            scan_kwargs = {"Limit": BATCH_SIZE}
            if last_key:
                scan_kwargs["ExclusiveStartKey"] = last_key
            
            response = table.scan(**scan_kwargs)
            items = response.get("Items", [])
            
            if not items:
                print("✓ Scan complete - no more items")
                break
            
            print(f"\nProcessing {len(items)} items...")
            
            # Batch write updates
            with table.batch_writer() as batch:
                for item in items:
                    scanned += 1
                    try:
                        # Normalize timestamps
                        normalized_item = normalize_trip_summary(item)
                        
                        # Write back (only if timestamps were normalized)
                        batch.put_item(Item=normalized_item)
                        updated += 1
                        
                        if scanned % 10 == 0:
                            print(f"  Processed {scanned} items ({updated} updated)")
                        
                        if limit and scanned >= limit:
                            print(f"Reached limit of {limit} items")
                            return scanned, updated, failed
                    
                    except Exception as e:
                        failed += 1
                        print(f"  ✗ Error processing {item.get('PK')}: {str(e)}")
            
            # Check if there are more items
            last_key = response.get("LastEvaluatedKey")
            if not last_key:
                break
    
    except Exception as e:
        print(f"✗ Error during backfill: {str(e)}")
        return scanned, updated, failed
    
    return scanned, updated, failed


def main():
    """Main entry point"""
    print("=" * 70)
    print("Trip Summary Timestamp Backfill")
    print("=" * 70)
    
    limit = None
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
            print(f"Backfilling up to {limit} trips...")
        except ValueError:
            print(f"Invalid limit: {sys.argv[1]}")
            sys.exit(1)
    else:
        print("Backfilling ALL existing trips...")
        confirm = input("\nContinue? (yes/no): ").strip().lower()
        if confirm != "yes":
            print("Cancelled.")
            sys.exit(0)
    
    print(f"Target table: {TABLE_NAME}")
    print(f"Region: {REGION}")
    print()
    
    scanned, updated, failed = backfill_trips(limit)
    
    print("\n" + "=" * 70)
    print("Backfill Complete:")
    print(f"  Scanned: {scanned}")
    print(f"  Updated: {updated}")
    print(f"  Failed:  {failed}")
    print("=" * 70)
    
    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
