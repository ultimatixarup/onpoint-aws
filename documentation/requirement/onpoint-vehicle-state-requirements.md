# Vehicle State Requirements Specification

## Purpose
This document defines the **Current Vehicle State** data model used to represent the real-time or near–real-time condition of a vehicle.
It is optimized for telematics ingestion, fleet monitoring, analytics, and event-driven workflows.

This specification builds on the existing vehicle state implementation and extends it to fully support **moving vehicles**.

---

## Entity Identification

| Attribute | Description |
|---------|------------|
| `PK` | Partition key in the format `VEHICLE#{VIN}` |
| `SK` | Sort key – fixed value: `STATE` |
| `schemaVersion` | Version of normalized telematics schema |
| `updatedAt` | Timestamp when this state record was last updated (ISO8601 UTC) |
| `lastEventTime` | Timestamp of the last telematics event received (ISO8601 UTC) |

---

## Core Vehicle State Attributes (Existing)

| Attribute | Type | Description |
|--------|------|------------|
| `vehicleState` | String | Logical state. Allowed: `PARKED`, `IDLE`, `MOVING`, `TRIP_STARTED`, `TRIP_ENDED` |
| `ignition_status` | String | Allowed: `ON`, `OFF` |
| `speed_mph` | Number | Current speed in mph |
| `heading` | Number | Direction of travel (0–359 degrees) |
| `lat` | Number | Latitude (WGS84) |
| `lon` | Number | Longitude (WGS84) |
| `odometer_miles` | Number | Total vehicle distance in miles |
| `fuelLevelGallons` | Number | Fuel volume in gallons |
| `fuelPercent` | Number | Fuel percentage remaining (0–100) |

---

## Additional Attributes for Moving Vehicles

When `vehicleState = MOVING`, the following attributes SHOULD be populated.

### Motion & Dynamics

| Attribute | Type | Description |
|--------|------|------------|
| `acceleration_mps2` | Number | Vehicle acceleration in m/s² |
| `deceleration_mps2` | Number | Braking intensity in m/s² |
| `yawRate_deg_per_sec` | Number | Turn rate in degrees/sec |
| `engine_rpm` | Number | Engine revolutions per minute |
| `gear_position` | String | Allowed: `P`, `R`, `N`, `D`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8` |
| `cruiseControlActive` | Boolean | Cruise control status |

---

### Trip Context

| Attribute | Type | Description |
|--------|------|------------|
| `tripId` | String | Unique identifier for current trip |
| `tripStartTime` | Timestamp | Trip start time (ISO8601 UTC) |
| `distanceSinceTripStart_miles` | Number | Distance traveled in miles |
| `durationSinceTripStart_seconds` | Number | Trip duration in seconds |

---

### Location Quality & Telemetry Health

| Attribute | Type | Description |
|--------|------|------------|
| `gpsFixQuality` | String | Allowed: `NO_FIX`, `2D`, `3D`, `DGPS`, `RTK` |
| `gpsAccuracyMeters` | Number | Accuracy in meters |
| `satelliteCount` | Number | Satellites visible (integer) |
| `signalSource` | String | Allowed: `OEM`, `OBD`, `MOBILE`, `THIRD_PARTY` |
| `telemetryLatencyMs` | Number | Latency in milliseconds |

---

### Driver Behavior (Optional)

| Attribute | Type | Description |
|--------|------|------------|
| `harshAcceleration` | Boolean | Aggressive acceleration |
| `harshBraking` | Boolean | Hard braking |
| `sharpTurn` | Boolean | Aggressive turn |
| `driverScore` | Number | Driving score |

---

### Powertrain & Energy (Optional)

| Attribute | Type | Description |
|--------|------|------------|
| `batterySOCPercent` | Number | Battery SOC (0–100) |
| `batteryRangeMiles` | Number | Estimated range |
| `energyConsumptionWhPerMile` | Number | Efficiency |
| `regenActive` | Boolean | Regenerative braking |

---

## State Transition Rules

| From | To | Condition |
|----|----|----------|
| `IDLE` | `MOVING` | Speed > threshold (default 2 mph) |
| `MOVING` | `IDLE` | Speed = 0 for >= 10 seconds |
| `IDLE` | `TRIP_STARTED` | Ignition ON + tripId assigned |
| `MOVING` | `TRIP_ENDED` | Ignition OFF |

---

## Storage Semantics

- One active state record per vehicle
- Overwritten on update
- Historical states stored separately
- High write frequency supported

## Required vs Optional

Required for all updates:
- `vehicleState`, `ignition_status`, `speed_mph`, `lat`, `lon`, `updatedAt`, `lastEventTime`, `schemaVersion`

Required when `vehicleState = MOVING`:
- `tripId`, `tripStartTime`, `distanceSinceTripStart_miles`, `durationSinceTripStart_seconds`

Optional:
- All other fields (populate when available)

---

## Example (Moving)

```json
{
  "vin": "4JGFB4FB7RA981998",
  "schemaVersion": "normalized-telematics-1.0",
  "updatedAt": "2026-02-01T20:00:00Z",
  "lastEventTime": "2026-02-01T20:00:00Z",
  "vehicleState": "MOVING",
  "ignition_status": "ON",
  "speed_mph": 62,
  "heading": 120,
  "lat": 33.642388,
  "lon": -117.740412,
  "odometer_miles": 19264.55,
  "tripId": "TRIP#20260201-001",
  "tripStartTime": "2026-02-01T19:34:06Z",
  "distanceSinceTripStart_miles": 12.4,
  "durationSinceTripStart_seconds": 1540,
  "engine_rpm": 2200,
  "gear_position": "D"
}
```

---

## Versioning
- Schema: normalized-telematics-1.0
