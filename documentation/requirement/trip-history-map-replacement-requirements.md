# Trip History — Map Panel Replacement Requirements

## 1) Objective
Replace the current **Trip Map** area on the Trip History page with a new two-panel layout that mirrors the provided design:
- Left detail card with start/end locations and trip metrics
- Right map panel with a route path and safety summary ribbon

## 2) Scope
- Applies to **Trip History** view only.
- Replaces the existing **Trip Map** panel and related empty/loading/error states with the new layout.
- Does **not** change data sources or trip selection logic unless explicitly noted below.

## 3) Layout & Structure

### 3.1 Container
New layout is a two-column split:
- **Left column:** Trip Detail Card
- **Right column:** Route Map Card with safety summary header

Responsive behavior:
- **Desktop:** two columns (left 40%, right 60%)
- **Tablet:** stacked, with map below details
- **Mobile:** stacked, detail card first

### 3.2 Left Column: Trip Detail Card
Contains two sections:

#### A) Start/End Summary
Two rows with icons:
- Start (green marker icon)
- End (orange marker icon)

Each row displays:
- Location label (street, city, state, ZIP, country)
- Timestamp in local time with timezone abbreviation (example: "Feb 18, 2026, 3:02 PM (PST)")

Fallback:
- If location string is not available, show **"Location unavailable"**

#### B) Metrics Grid
3 columns per row, 4 rows (**12 metrics total**):
1. Average Speed (mph)
2. Odometer (miles)
3. Mileage (mpg)
4. Fuel Consumed (gal)
5. Fuel Level (gal)
6. EV Battery Consumed (%)
7. EV Battery Level (%)
8. EV Battery Remaining (%)
9. EV Range (miles)
10. Trip Distance (miles)
11. Trip Duration (hh:mm:ss)
12. Idling Duration (hh:mm:ss)

Each metric shows:
- Icon
- Label
- Value

Powertrain display rule:
- If vehicle is **EV**, show EV metrics:
	- EV Battery Consumed (%)
	- EV Battery Level (%)
	- EV Battery Remaining (%)
	- EV Range (miles)
- If vehicle is **non-EV**, hide all EV metrics from the Metrics Grid.

## 4) Right Column: Route Map Card

### 4.1 Safety Summary Ribbon (Header)
A horizontal strip above the map showing:
- Harsh Acceleration (count)
- Harsh Braking (count)
- Harsh Cornering (count)
- Overspeeding (miles)
- Night Driving (miles)

Each item includes:
- Icon
- Label
- Value
- Units (if applicable)

### 4.2 Map
- Shows route line between start and end
- Start and end markers (green for start, orange for end)
- Must show road-following path (no straight-line rendering)
- Interactive map controls remain (zoom, fullscreen)

## 5) Data Requirements

### 5.1 Data Sources
- Trip summary (existing): distance, duration, start/end time, VIN, etc.
- Trip events (existing): GPS points for route
- Trip analytics (new or existing): harsh events, overspeed miles, night driving miles, odometer, fuel, EV stats

### 5.2 Data Mapping

| UI Field | Source | Notes |
|---|---|---|
| Start Address | Geocoded from first GPS point | If no geocode, use "Location unavailable" |
| End Address | Geocoded from last GPS point | Same rule |
| Start Time | Trip start time | Localized with timezone |
| End Time | Trip end time | Localized with timezone |
| Average Speed | Derived | $avg\_speed = \frac{distance}{duration}$ |
| Odometer | Telemetry | Latest known odometer at trip end |
| Mileage (mpg) | Derived | $mpg = \frac{distance}{fuel\_consumed}$ |
| Fuel Consumed | Telemetry | Sum if available; otherwise "NA" |
| Fuel Level | Telemetry | End-of-trip value |
| EV Battery Consumed | Telemetry | % drop over trip; render only for EV vehicles |
| EV Battery Level | Telemetry | End-of-trip %; render only for EV vehicles |
| EV Battery Remaining | Same as EV Battery Level | If separate field exists, use it; render only for EV vehicles |
| EV Range | Telemetry | End-of-trip estimate; render only for EV vehicles |
| Trip Distance | Trip summary | Miles with 2 decimals |
| Trip Duration | Trip summary | hh:mm:ss |
| Idling Duration | Trip analytics | If missing, "NA" |
| Harsh Acceleration / Braking / Cornering | Event counts | Derived from event stream |
| Overspeeding Miles | Trip analytics | If missing, 0.00 |
| Night Driving Miles | Trip analytics | If missing, 0.00 |

### 5.3 Geocoding
- Reverse geocode first and last route points to address strings
- Must cache results per trip (client or server) to reduce cost
- If geocoding fails, display **"Location unavailable"**

## 6) UI States & Behavior

### 6.1 Loading
- Show skeleton/placeholder for detail card and map
- Safety ribbon shows placeholders

### 6.2 Error
- If route fetch fails, show map with raw GPS polyline as fallback
- If analytics fail, display values as "NA" or "0" without blocking map rendering

### 6.3 No Data
- If no GPS points: show **"No GPS points available"** and hide map
- If trip not selected: show **"Select a trip"** state

### 6.4 Conditional Metric Visibility by Vehicle Type
- Determine vehicle type from existing vehicle metadata/powertrain field.
- If vehicle type is EV, display EV metrics in the grid.
- If vehicle type is non-EV (ICE/Hybrid without EV telemetry), EV metrics must be hidden (not shown as "NA").
- If vehicle type is unknown, default to non-EV behavior and hide EV metrics.

## 7) Styling & Visual Requirements
- Card styling must remain consistent with the current design system
- Start/end markers must use green and orange pin styles
- Metrics grid: aligned icons and labels, values in bold
- Safety ribbon: compact, evenly spaced, light background

## 8) Non-Functional Requirements
- Map routing response time: **< 2 seconds** for up to 100 sampled points
- Geocoding must not block rendering; addresses can load progressively
- Accessibility: all metrics and labels must be screen-reader readable
- Internationalization-ready formatting for dates and numbers

## 9) Implementation Notes (Behavioral)
- The new layout must **replace** the existing map panel, not appear alongside it
- The page must re-render when a different trip is selected
- Route snapping to roads remains required
