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
| `updatedAt` | Timestamp when this state record was last updated |
| `lastEventTime` | Timestamp of the last telematics event received |

---

## Core Vehicle State Attributes (Existing)

| Attribute | Type | Description |
|--------|------|------------|
| `vehicleState` | String | Logical state (e.g., `MOVING`, `IDLE`, `TRIP_STARTED`, `TRIP_ENDED`) |
| `ignition_status` | String | `ON` or `OFF` |
| `speed_mph` | Number | Current speed |
| `heading` | Number | Direction of travel (0–359 degrees) |
| `lat` | Number | Latitude |
| `lon` | Number | Longitude |
| `odometer_Miles` | Number | Total vehicle distance |
| `fuelLevelGallons` | Number | Fuel volume |
| `fuelPercent` | Number | Fuel percentage remaining |

---

## Additional Attributes for Moving Vehicles

When `vehicleState = MOVING`, the following attributes SHOULD be populated.

### Motion & Dynamics

| Attribute | Type | Description |
|--------|------|------------|
| `acceleration_mps2` | Number | Vehicle acceleration |
| `deceleration_mps2` | Number | Braking intensity |
| `yawRate_deg_per_sec` | Number | Turn rate |
| `engineRPM` | Number | Engine revolutions per minute |
| `gearPosition` | String | Current gear |
| `cruiseControlActive` | Boolean | Cruise control status |

---

### Trip Context

| Attribute | Type | Description |
|--------|------|------------|
| `tripId` | String | Unique identifier for current trip |
| `tripStartTime` | Timestamp | Trip start time |
| `distanceSinceTripStart_Miles` | Number | Distance traveled |
| `durationSinceTripStart_Seconds` | Number | Trip duration |

---

### Location Quality & Telemetry Health

| Attribute | Type | Description |
|--------|------|------------|
| `gpsFixQuality` | String | GPS quality |
| `gpsAccuracyMeters` | Number | Accuracy |
| `satelliteCount` | Number | Satellites |
| `signalSource` | String | Data source |
| `telemetryLatencyMs` | Number | Latency |

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
| `batterySOCPercent` | Number | Battery SOC |
| `batteryRangeMiles` | Number | Estimated range |
| `energyConsumptionWhPerMile` | Number | Efficiency |
| `regenActive` | Boolean | Regenerative braking |

---

## State Transition Rules

| From | To | Condition |
|----|----|----------|
| `IDLE` | `MOVING` | Speed > threshold |
| `MOVING` | `IDLE` | Speed = 0 |
| `MOVING` | `TRIP_ENDED` | Ignition OFF |

---

## Storage Semantics

- One active state record per vehicle
- Overwritten on update
- Historical states stored separately
- High write frequency supported

---

## Example (Moving)

```json
{
  "vehicleState": "MOVING",
  "speed_mph": 62,
  "engineRPM": 2200,
  "gearPosition": "D",
  "tripId": "TRIP#20260201-001"
}
```

---

## Versioning
- Schema: normalized-telematics-1.0
