import { formatDate } from "../utils/date";
import { httpRequest } from "./httpClient";

export type TripSummaryItem = {
  vin: string;
  tripId: string;
  startTime?: string;
  endTime?: string;
  tripStatus?: string;
  milesDriven?: number;
  fuelConsumed?: number;
  safetyScore?: number;
  overspeedEventCountTotal?: number;
};

export type TripSummaryResponse = {
  items: TripSummaryItem[];
  nextToken?: string | null;
};

export type TripSummaryDetailResponse = TripSummaryItem & {
  summary?: Record<string, unknown> | string | null;
  refueledGallons?: number;
  updatedAt?: string;
  schemaVersion?: string;
  [key: string]: unknown;
};

export type TripEventItem = {
  eventTime?: string;
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  location?: {
    lat?: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
  };
  geo?: {
    lat?: number;
    lon?: number;
    latitude?: number;
    longitude?: number;
  };
  [key: string]: unknown;
};

export type TripEventsResponse = {
  vin: string;
  tripId: string;
  count: number;
  items: TripEventItem[];
  nextToken?: string | null;
};

export type TripMapEventMarker = {
  type:
    | "overspeed"
    | "harsh_accel"
    | "harsh_brake"
    | "harsh_corner"
    | "collision";
  lat: number;
  lon: number;
  timestamp: string;
  severity?: "STANDARD" | "SEVERE";
  details?: Record<string, unknown>;
};

export type TripMapData = {
  sampledPath: Array<[number, number]>;
  snappedPath: Array<[number, number]> | null;
  startCoords: [number, number] | null;
  endCoords: [number, number] | null;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } | null;
  eventMarkers: TripMapEventMarker[];
  generatedAt: string | null;
};

export type TripMapResponse = {
  vin: string;
  tripId: string;
  map: TripMapData;
};

export type TripHistoryStatItem = {
  label: string;
  value: string;
};

export type TripHistoryTableRow = {
  id: string;
  driverName: string;
  vin: string;
  start: string;
  end: string;
  startTimestamp: string;
  endTimestamp: string;
  endOdometer: string;
  miles: string;
  duration: string;
  alerts: number;
};

export type TripMetricCardItem = {
  label: string;
  value: string;
  icon: string;
};

export type TripSummaryCardItem = {
  label: string;
  value: string;
  icon: string;
};

export type TripDetailPresentation = {
  tripStartLabel: string;
  tripEndLabel: string;
  metricItems: TripMetricCardItem[];
  summaryItems: TripSummaryCardItem[];
};

export type TripHistoryAssignmentRecord = {
  assignmentId?: string;
  vin?: string;
  driverId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

type TripSummaryQuery = {
  tenantId: string;
  tenantHeaderId?: string;
  fleetId?: string;
  vin?: string;
  vehicleIds?: string[];
  from?: string;
  to?: string;
  limit?: number;
  include?: "none" | "summary";
};

const tripSummaryBaseUrl =
  import.meta.env.VITE_TRIP_SUMMARY_BASE_URL ?? "/trip-summary";
const tripSummaryApiKey =
  import.meta.env.VITE_TRIP_SUMMARY_API_KEY ??
  import.meta.env.VITE_ONPOINT_API_KEY ??
  "";

export async function fetchTripSummaryTrips({
  tenantId,
  tenantHeaderId,
  fleetId,
  vin,
  vehicleIds,
  from,
  to,
  limit = 50,
  include,
}: TripSummaryQuery): Promise<TripSummaryResponse> {
  const coerceNumber = (value: unknown): number | undefined => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };

  const getPath = (record: Record<string, unknown>, path: string) => {
    const parts = path.split(".");
    let current: unknown = record;
    for (const part of parts) {
      if (!current || typeof current !== "object") return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  };

  const readNumber = (record: Record<string, unknown>, paths: string[]) => {
    for (const path of paths) {
      const value = coerceNumber(getPath(record, path));
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const normalizeTripSummaryItem = (item: TripSummaryItem): TripSummaryItem => {
    const record = item as Record<string, unknown>;
    const miles = readNumber(record, [
      "milesDriven",
      "miles_driven",
      "milesDrivenTotal",
      "mileage",
      "miles",
      "distanceMi",
      "distance_mi",
      "distance",
      "distanceMiles",
      "distance_miles",
      "tripMiles",
      "trip_miles",
      "tripDistance",
      "tripDistanceMiles",
      "trip_distance",
      "trip_distance_miles",
      "totalDistance",
      "total_distance",
      "totalMiles",
      "total_miles",
      "summary.milesDriven",
      "summary.miles_driven",
      "summary.milesDrivenTotal",
      "summary.mileage",
      "summary.miles",
      "summary.distanceMi",
      "summary.distance_mi",
      "summary.milesDriven",
      "summary.distance",
      "summary.distanceMiles",
      "metrics.milesDriven",
      "metrics.miles_driven",
      "metrics.miles",
      "metrics.distanceMi",
      "metrics.distance_mi",
      "metrics.distance",
      "metrics.distanceMiles",
      "stats.milesDriven",
      "stats.miles_driven",
      "stats.miles",
      "stats.distanceMi",
      "stats.distance_mi",
      "stats.distance",
      "stats.distanceMiles",
      "totals.milesDriven",
      "totals.miles_driven",
      "totals.miles",
      "totals.distanceMi",
      "totals.distance_mi",
      "totals.distance",
      "totals.distanceMiles",
    ]);

    const distanceKm = readNumber(record, [
      "distanceKm",
      "distance_km",
      "distanceKilometers",
      "distance_kilometers",
      "tripDistanceKm",
      "trip_distance_km",
      "summary.distanceKm",
      "summary.distance_km",
      "metrics.distanceKm",
      "metrics.distance_km",
      "stats.distanceKm",
      "stats.distance_km",
      "totals.distanceKm",
      "totals.distance_km",
    ]);

    const distanceMeters = readNumber(record, [
      "distanceMeters",
      "distance_meters",
      "distanceMeter",
      "distance_meter",
      "tripDistanceMeters",
      "trip_distance_meters",
      "summary.distanceMeters",
      "summary.distance_meters",
      "metrics.distanceMeters",
      "metrics.distance_meters",
      "stats.distanceMeters",
      "stats.distance_meters",
      "totals.distanceMeters",
      "totals.distance_meters",
    ]);

    const milesFromKm =
      typeof distanceKm === "number" && distanceKm > 0
        ? distanceKm / 1.609344
        : undefined;
    const milesFromMeters =
      typeof distanceMeters === "number" && distanceMeters > 0
        ? distanceMeters / 1609.344
        : undefined;

    const odometerStart = readNumber(record, [
      "odometerStart",
      "odometer_start",
      "odometerStartMiles",
      "odometer_start_miles",
      "summary.odometerStart",
      "summary.odometer_start",
      "telemetry.odometerStart",
    ]);
    const odometerEnd = readNumber(record, [
      "odometerEnd",
      "odometer_end",
      "odometerEndMiles",
      "odometer_end_miles",
      "summary.odometerEnd",
      "summary.odometer_end",
      "telemetry.odometerEnd",
    ]);

    const odometerMiles =
      odometerStart !== undefined &&
      odometerEnd !== undefined &&
      odometerEnd >= odometerStart
        ? odometerEnd - odometerStart
        : undefined;

    return {
      ...item,
      vin: item.vin ?? (record.vehicleId as string | undefined) ?? "",
      tripId: item.tripId ?? (record.trip_id as string | undefined) ?? "",
      milesDriven:
        miles ??
        milesFromKm ??
        milesFromMeters ??
        odometerMiles ??
        item.milesDriven,
    };
  };

  const params = new URLSearchParams();
  params.set("tenantId", tenantId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", String(limit));
  if (include) params.set("include", include);
  if (vehicleIds && vehicleIds.length > 0) {
    params.set("vehicleIds", vehicleIds.join(","));
  }

  const path = fleetId
    ? `/fleets/${fleetId}/trips?${params.toString()}`
    : `/trips?${new URLSearchParams({
        ...Object.fromEntries(params),
        ...(vin ? { vehicleId: vin } : {}),
      }).toString()}`;

  const response = await httpRequest<TripSummaryResponse>(path, {
    baseUrl: tripSummaryBaseUrl,
    headers: {
      ...(tripSummaryApiKey ? { "x-api-key": tripSummaryApiKey } : {}),
      "x-tenant-id": tenantHeaderId ?? tenantId,
    },
  });

  return {
    ...response,
    items: (response.items ?? []).map(normalizeTripSummaryItem),
  };
}

export async function fetchTripEvents(params: {
  tenantId: string;
  tenantHeaderId?: string;
  vin: string;
  tripId: string;
  limit?: number;
  nextToken?: string;
}): Promise<TripEventsResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.nextToken) query.set("nextToken", params.nextToken);
  const suffix = query.toString();
  const path = `/trips/${encodeURIComponent(params.vin)}/${encodeURIComponent(
    params.tripId,
  )}/events${suffix ? `?${suffix}` : ""}`;

  return httpRequest<TripEventsResponse>(path, {
    baseUrl: tripSummaryBaseUrl,
    headers: {
      ...(tripSummaryApiKey ? { "x-api-key": tripSummaryApiKey } : {}),
      "x-tenant-id": params.tenantHeaderId ?? params.tenantId,
    },
  });
}

export async function fetchTripEventsRaw(params: {
  tenantId: string;
  tenantHeaderId?: string;
  vin: string;
  tripId: string;
  limit?: number;
  nextToken?: string;
}): Promise<TripEventsResponse> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.nextToken) query.set("nextToken", params.nextToken);
  const suffix = query.toString();
  const path = `/trips/${encodeURIComponent(params.vin)}/${encodeURIComponent(
    params.tripId,
  )}/events/raw${suffix ? `?${suffix}` : ""}`;

  return httpRequest<TripEventsResponse>(path, {
    baseUrl: tripSummaryBaseUrl,
    headers: {
      ...(tripSummaryApiKey ? { "x-api-key": tripSummaryApiKey } : {}),
      "x-tenant-id": params.tenantHeaderId ?? params.tenantId,
    },
  });
}

export async function fetchTripMapData(params: {
  tenantId: string;
  tenantHeaderId?: string;
  vin: string;
  tripId: string;
}): Promise<TripMapResponse> {
  const path = `/trips/${encodeURIComponent(params.vin)}/${encodeURIComponent(
    params.tripId,
  )}/map`;

  return httpRequest<TripMapResponse>(path, {
    baseUrl: tripSummaryBaseUrl,
    headers: {
      ...(tripSummaryApiKey ? { "x-api-key": tripSummaryApiKey } : {}),
      "x-tenant-id": params.tenantHeaderId ?? params.tenantId,
    },
  });
}

export async function fetchTripSummaryTripDetail(params: {
  tenantId: string;
  tenantHeaderId?: string;
  vin: string;
  tripId: string;
  include?: "none" | "summary";
}): Promise<TripSummaryDetailResponse> {
  const query = new URLSearchParams();
  if (params.include) query.set("include", params.include);
  const suffix = query.toString();
  const path = `/trips/${encodeURIComponent(params.vin)}/${encodeURIComponent(
    params.tripId,
  )}${suffix ? `?${suffix}` : ""}`;

  return httpRequest<TripSummaryDetailResponse>(path, {
    baseUrl: tripSummaryBaseUrl,
    headers: {
      ...(tripSummaryApiKey ? { "x-api-key": tripSummaryApiKey } : {}),
      "x-tenant-id": params.tenantHeaderId ?? params.tenantId,
    },
  });
}

export async function fetchTripEventPositions(params: {
  tenantId: string;
  tenantHeaderId?: string;
  vin: string;
  tripId: string;
  limit?: number;
}): Promise<Array<[number, number]>> {
  const response = await fetchTripEvents({
    tenantId: params.tenantId,
    tenantHeaderId: params.tenantHeaderId,
    vin: params.vin,
    tripId: params.tripId,
    limit: params.limit,
  });

  return (response.items ?? [])
    .map((item) => {
      const directLat = toNumber(item.lat ?? item.latitude);
      const directLon = toNumber(item.lon ?? item.longitude);
      if (directLat !== null && directLon !== null)
        return [directLat, directLon] as [number, number];

      const location = item.location;
      if (location) {
        const locLat = toNumber(location.lat ?? location.latitude);
        const locLon = toNumber(location.lon ?? location.longitude);
        if (locLat !== null && locLon !== null)
          return [locLat, locLon] as [number, number];
      }

      const geo = item.geo;
      if (geo) {
        const geoLat = toNumber(geo.lat ?? geo.latitude);
        const geoLon = toNumber(geo.lon ?? geo.longitude);
        if (geoLat !== null && geoLon !== null)
          return [geoLat, geoLon] as [number, number];
      }

      return null;
    })
    .filter((value): value is [number, number] => Boolean(value));
}

export async function fetchTripHistoryTrips(params: {
  tenantId: string;
  tenantHeaderId?: string;
  selectedVin?: string;
  fleetId?: string;
  fleetIds?: string[];
  from?: string;
  to?: string;
  limit?: number;
}): Promise<TripSummaryResponse> {
  const {
    tenantId,
    tenantHeaderId,
    selectedVin,
    fleetId,
    from,
    to,
    limit = 50,
  } = params;

  if (selectedVin && selectedVin !== "all") {
    return fetchTripSummaryTrips({
      tenantId,
      tenantHeaderId,
      vin: selectedVin,
      from,
      to,
      limit,
      include: "none",
    });
  }

  if (fleetId) {
    return fetchTripSummaryTrips({
      tenantId,
      tenantHeaderId,
      fleetId,
      from,
      to,
      limit,
      include: "none",
    });
  }

  const allFleetIds = params.fleetIds ?? [];
  if (!allFleetIds.length) return { items: [], nextToken: null };

  const responses = await Promise.all(
    allFleetIds.map((currentFleetId) =>
      fetchTripSummaryTrips({
        tenantId,
        tenantHeaderId,
        fleetId: currentFleetId,
        from,
        to,
        limit,
        include: "none",
      }),
    ),
  );

  const merged = responses.flatMap((response) => response.items ?? []);
  merged.sort((a, b) => {
    const aEnd = a.endTime ? new Date(a.endTime).getTime() : 0;
    const bEnd = b.endTime ? new Date(b.endTime).getTime() : 0;
    return bEnd - aEnd;
  });

  return { items: merged, nextToken: null };
}

export function buildTripHistoryStats(
  dateRange: string,
  items: TripSummaryItem[],
): TripHistoryStatItem[] {
  const totalTrips = items.length;
  const totalMiles = items.reduce(
    (sum, item) =>
      sum + (typeof item.milesDriven === "number" ? item.milesDriven : 0),
    0,
  );
  const totalAlerts = items.reduce(
    (sum, item) =>
      sum +
      (typeof item.overspeedEventCountTotal === "number"
        ? item.overspeedEventCountTotal
        : 0),
    0,
  );
  const totalEngineMinutes = items
    .map((item) => minutesBetween(item.startTime, item.endTime))
    .filter((value): value is number => typeof value === "number")
    .reduce((sum, value) => sum + value, 0);

  return [
    {
      label: `Trips (${rangeLabel(dateRange)})`,
      value: totalTrips.toLocaleString(),
    },
    {
      label: "Miles driven",
      value:
        totalMiles > 0
          ? totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })
          : "0",
    },
    {
      label: "Total engine hours",
      value: totalEngineMinutes > 0 ? formatMinutes(totalEngineMinutes) : "0m",
    },
    { label: "Alerts", value: totalAlerts.toLocaleString() },
  ];
}

export function buildTripHistoryRows(params: {
  items: TripSummaryItem[];
  assignmentsByVin: Map<string, TripHistoryAssignmentRecord[]>;
  driverNameById: Map<string, string>;
  search: string;
}): TripHistoryTableRow[] {
  const normalized = params.items.map((item) => {
    const record = item as Record<string, unknown>;
    const summary = parseSummary(
      record.summary ?? record.summaryJson ?? record.tripSummary,
    );
    const startTimeRaw =
      readStringFromRecord(record, [
        "startTime",
        "start_time",
        "tripStartTime",
      ]) ??
      readStringFromRecord(summary ?? {}, [
        "startTime",
        "start_time",
        "tripStartTime",
      ]) ??
      item.startTime;
    const endTimeRaw =
      readStringFromRecord(record, ["endTime", "end_time", "tripEndTime"]) ??
      readStringFromRecord(summary ?? {}, [
        "endTime",
        "end_time",
        "tripEndTime",
      ]) ??
      item.endTime;
    let endOdometer =
      readNumberFromRecord(record, [
        "endMiles",
        "odometerEnd",
        "odometer_end",
        "odometerEndMiles",
        "odometer_end_miles",
        "odometer.endMiles",
        "telemetry.odometerEnd",
        "telemetry.odometerEndMiles",
      ]) ??
      readNumberFromRecord(summary ?? {}, [
        "endMiles",
        "odometerEnd",
        "odometer_end",
        "odometerEndMiles",
        "odometer_end_miles",
        "odometer.endMiles",
      ]);

    // Extract from nested summary.odometer.endMiles if not found
    if (endOdometer === undefined && summary) {
      try {
        const summaryObj =
          typeof summary === "string" ? JSON.parse(summary) : summary;
        if (
          summaryObj &&
          typeof summaryObj === "object" &&
          summaryObj.odometer &&
          typeof summaryObj.odometer === "object"
        ) {
          const val = summaryObj.odometer.endMiles;
          if (typeof val === "number" && val > 0) {
            endOdometer = val;
          } else if (typeof val === "string") {
            const parsed = parseFloat(val);
            if (!isNaN(parsed) && parsed > 0) {
              endOdometer = parsed;
            }
          }
        }
      } catch (e) {
        // ignore parsing errors
      }
    }
    const driverName =
      readStringFromRecord(record, [
        "driverName",
        "driver.name",
        "driverDisplayName",
        "driver.displayName",
        "operatorName",
        "operator.name",
        "assignedDriverName",
        "driverId",
      ]) ??
      readStringFromRecord(summary ?? {}, [
        "driverName",
        "driver.name",
        "driverDisplayName",
        "driver.displayName",
        "operatorName",
        "operator.name",
        "assignedDriverName",
        "driverId",
      ]) ??
      "--";
    const resolvedAssignment = resolveAssignmentForTrip(
      params.assignmentsByVin.get(item.vin ?? "") ?? [],
      startTimeRaw,
      endTimeRaw,
    );
    const resolvedDriverId = resolvedAssignment?.driverId;
    const resolvedDriverName =
      (resolvedDriverId
        ? params.driverNameById.get(resolvedDriverId)
        : undefined) ?? resolvedDriverId;

    return {
      id: item.tripId,
      driverName:
        driverName !== "--" ? driverName : (resolvedDriverName ?? "--"),
      vin: item.vin,
      start: formatDate(startTimeRaw, "--"),
      end: formatDate(endTimeRaw, "--"),
      startTimestamp: formatDateTime(startTimeRaw),
      endTimestamp: formatDateTime(endTimeRaw),
      endOdometer:
        typeof endOdometer === "number" ? `${endOdometer.toFixed(2)} mi` : "--",
      miles:
        typeof item.milesDriven === "number"
          ? item.milesDriven.toFixed(1)
          : "--",
      duration:
        startTimeRaw && endTimeRaw
          ? formatDuration(startTimeRaw, endTimeRaw)
          : "--",
      alerts: item.overspeedEventCountTotal ?? 0,
    };
  });

  if (!params.search.trim()) return normalized;
  const term = params.search.trim().toLowerCase();
  return normalized.filter(
    (trip) =>
      trip.id.toLowerCase().includes(term) ||
      trip.driverName.toLowerCase().includes(term),
  );
}

export function buildTripDetailPresentation(params: {
  selectedTrip: TripSummaryItem | null;
  selectedTripDetail: TripSummaryDetailResponse | null | undefined;
  isSelectedVehicleEv: boolean;
}): TripDetailPresentation {
  const selectedTripRecord = params.selectedTripDetail
    ? (params.selectedTripDetail as Record<string, unknown>)
    : params.selectedTrip
      ? (params.selectedTrip as Record<string, unknown>)
      : null;
  const summaryRecord = parseSummary(
    selectedTripRecord?.summary ??
      selectedTripRecord?.summaryJson ??
      selectedTripRecord?.tripSummary,
  );

  const distanceMiles =
    readNumberFromTrip(selectedTripRecord, summaryRecord, ["milesDriven"]) ??
    params.selectedTrip?.milesDriven;
  const startTime =
    readStringFromTrip(selectedTripRecord, summaryRecord, ["startTime"]) ??
    params.selectedTrip?.startTime;
  const endTime =
    readStringFromTrip(selectedTripRecord, summaryRecord, ["endTime"]) ??
    params.selectedTrip?.endTime;
  const durationMinutes = minutesBetween(startTime, endTime);
  const durationHours =
    typeof durationMinutes === "number" ? durationMinutes / 60 : undefined;

  const avgSpeedFromSummary = readNumberFromTrip(
    selectedTripRecord,
    summaryRecord,
    ["averageSpeedMph", "speed.averageMph"],
  );
  const avgSpeed =
    avgSpeedFromSummary ??
    (typeof distanceMiles === "number" && durationHours && durationHours > 0
      ? distanceMiles / durationHours
      : undefined);

  const fuelConsumed = readFuelGallonsFromTrip(
    selectedTripRecord,
    summaryRecord,
    {
      gallons: [
        "fuelConsumedGallons",
        "fuel.fuelConsumedGallons",
        "fuel.consumedGallons",
      ],
      liters: [
        "fuel.fuelConsumed",
        "fuel.fuelConsumedLiters",
        "fuelConsumed",
        "fuelConsumedLiters",
        "fuel.consumedLiters",
      ],
    },
  );

  const mpg =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "mpg.actualMpg",
      "fuelEfficiencyMpg",
    ]) ??
    (typeof distanceMiles === "number" &&
    typeof fuelConsumed === "number" &&
    fuelConsumed > 0
      ? distanceMiles / fuelConsumed
      : undefined);

  const odometerEnd = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "odometerEnd",
    "odometer.endMiles",
    "odometer_end_miles",
  ]);

  const fuelLevelGallons = readFuelGallonsFromTrip(
    selectedTripRecord,
    summaryRecord,
    {
      gallons: [
        "fuel.fuelIndicatorAbsoluteGallons",
        "fuelIndicatorAbsoluteGallons",
        "fuelIndicatorGallons",
        "fuel.endGallons",
      ],
      liters: [
        "fuel.fuelIndicatorAbsoluteLiters",
        "fuelIndicatorAbsoluteLiters",
        "fuelIndicatorLiters",
        "fuel.endLiters",
      ],
    },
  );
  const fuelLevelPercent = readNumberFromTrip(
    selectedTripRecord,
    summaryRecord,
    ["fuel.fuelIndicatorPercent", "fuelIndicatorPercent", "fuelPercent"],
  );

  const evBatteryStart = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "evData.batteryLevelStartPercent",
    "batteryLevelStartPercent",
  ]);
  const evBatteryEnd = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "evData.batteryLevelEndPercent",
    "batteryLevelEndPercent",
  ]);
  const evBatteryConsumed =
    evBatteryStart !== undefined && evBatteryEnd !== undefined
      ? Math.max(0, evBatteryStart - evBatteryEnd)
      : undefined;
  const evRangeEnd = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "evData.rangeEndMiles",
    "rangeEndMiles",
  ]);

  const idlingSeconds =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "idlingTimeSeconds",
      "idling_seconds",
    ]) ??
    parseHmsToSeconds(
      readStringFromTrip(selectedTripRecord, summaryRecord, ["idlingTime"]),
    );

  const nightMiles = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "distance.nightMiles",
    "nightMiles",
  ]);

  const overspeedMilesTotal =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "overspeedMilesTotal",
      "overspeed.milesTotal",
    ]) ??
    sumOptional(
      readNumberFromTrip(selectedTripRecord, summaryRecord, [
        "overspeedMilesStandard",
        "overspeed.milesStandard",
      ]),
      readNumberFromTrip(selectedTripRecord, summaryRecord, [
        "overspeedMilesSevere",
        "overspeed.milesSevere",
      ]),
    );

  const overspeedEventCountTotal =
    readNumberFromTrip(selectedTripRecord, summaryRecord, [
      "overspeedEventCountTotal",
      "overspeed.eventCountTotal",
    ]) ??
    sumOptional(
      readNumberFromTrip(selectedTripRecord, summaryRecord, [
        "overspeedEventCountStandard",
        "overspeed.eventCountStandard",
      ]),
      readNumberFromTrip(selectedTripRecord, summaryRecord, [
        "overspeedEventCountSevere",
        "overspeed.eventCountSevere",
      ]),
    );

  const harshAcceleration = readNumberFromTrip(
    selectedTripRecord,
    summaryRecord,
    ["events.harshAccelerationCount", "harshAccelerationCount"],
  );
  const harshBraking = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "events.harshBrakingCount",
    "harshBrakingCount",
  ]);
  const harshCornering = readNumberFromTrip(selectedTripRecord, summaryRecord, [
    "events.harshCorneringCount",
    "harshCorneringCount",
  ]);

  const summaryItems: TripSummaryCardItem[] = [
    {
      label: "Harsh Acceleration",
      value: formatOptionalNumber(harshAcceleration ?? 0, 0),
      icon: "⚡",
    },
    {
      label: "Harsh Braking",
      value: formatOptionalNumber(harshBraking ?? 0, 0),
      icon: "🛑",
    },
    {
      label: "Harsh Cornering",
      value: formatOptionalNumber(harshCornering ?? 0, 0),
      icon: "↪️",
    },
    {
      label: "Over Speeding (miles)",
      value: formatOptionalNumber(overspeedMilesTotal, 2),
      icon: "🚗",
    },
    {
      label: "Over Speeding (events)",
      value: formatOptionalNumber(overspeedEventCountTotal ?? 0, 0),
      icon: "🚨",
    },
    {
      label: "Night Driving (miles)",
      value: formatOptionalNumber(nightMiles, 2),
      icon: "🌙",
    },
  ];

  const metricItems: TripMetricCardItem[] = [
    {
      label: "Average Speed",
      value: formatOptionalNumber(avgSpeed, 2, " mph"),
      icon: "🏎️",
    },
    {
      label: "Odometer",
      value:
        typeof odometerEnd === "number"
          ? `${odometerEnd.toFixed(2)} miles`
          : "NA",
      icon: "🧭",
    },
    {
      label: "Mileage",
      value: mpg !== undefined ? `${mpg.toFixed(2)} mpg` : "NA",
      icon: "⛽",
    },
    {
      label: "Fuel Consumed",
      value: formatOptionalNumber(fuelConsumed, 2, " gal"),
      icon: "🛢️",
    },
    {
      label: "Fuel Level",
      value:
        typeof fuelLevelGallons === "number"
          ? `${fuelLevelGallons.toFixed(2)} gal`
          : typeof fuelLevelPercent === "number"
            ? `${fuelLevelPercent.toFixed(1)}%`
            : "NA",
      icon: "⛽",
    },
  ];

  if (params.isSelectedVehicleEv) {
    metricItems.push(
      {
        label: "EV Battery Consumed",
        value:
          typeof evBatteryConsumed === "number"
            ? `${evBatteryConsumed.toFixed(1)}%`
            : "NA",
        icon: "🔋",
      },
      {
        label: "EV Battery Level",
        value:
          typeof evBatteryEnd === "number"
            ? `${evBatteryEnd.toFixed(1)}%`
            : "NA",
        icon: "🔋",
      },
      {
        label: "EV Battery Remaining",
        value:
          typeof evBatteryEnd === "number"
            ? `${evBatteryEnd.toFixed(1)}%`
            : "NA",
        icon: "🔋",
      },
      {
        label: "EV Range",
        value:
          typeof evRangeEnd === "number"
            ? `${evRangeEnd.toFixed(2)} miles`
            : "NA",
        icon: "🧮",
      },
    );
  }

  metricItems.push(
    {
      label: "Trip Distance",
      value:
        typeof distanceMiles === "number"
          ? `${distanceMiles.toFixed(2)} miles`
          : "NA",
      icon: "📍",
    },
    {
      label: "Trip Duration",
      value: formatDurationDetailed(startTime, endTime),
      icon: "⏱️",
    },
    {
      label: "Idling Duration",
      value:
        typeof idlingSeconds === "number"
          ? formatSecondsAsDuration(idlingSeconds)
          : "NA",
      icon: "🕒",
    },
  );

  return {
    tripStartLabel: formatDateTime(startTime),
    tripEndLabel: formatDateTime(endTime),
    metricItems,
    summaryItems,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function parseSummary(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as Record<string, unknown>;
      return typeof parsed === "object" && parsed ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function parseIsoToMs(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? undefined : time;
}

function resolveAssignmentForTrip(
  assignments: TripHistoryAssignmentRecord[],
  startTime?: string,
  endTime?: string,
) {
  if (!assignments.length) return undefined;
  const tripTime = parseIsoToMs(startTime) ?? parseIsoToMs(endTime);

  if (tripTime === undefined) return assignments[0];

  const matching = assignments.filter((assignment) => {
    const from = parseIsoToMs(assignment.effectiveFrom);
    const to = parseIsoToMs(assignment.effectiveTo);
    if (from !== undefined && tripTime < from) return false;
    if (to !== undefined && tripTime > to) return false;
    return true;
  });

  if (matching.length > 0) {
    return matching.sort(
      (a, b) =>
        (parseIsoToMs(b.effectiveFrom) ?? 0) -
        (parseIsoToMs(a.effectiveFrom) ?? 0),
    )[0];
  }

  return assignments[0];
}

function getPath(record: Record<string, unknown>, path: string) {
  const parts = path.split(".");
  let current: unknown = record;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function readNumberFromRecord(
  record: Record<string, unknown>,
  paths: string[],
) {
  for (const path of paths) {
    const value = getPath(record, path);
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function readStringFromRecord(
  record: Record<string, unknown>,
  paths: string[],
) {
  for (const path of paths) {
    const value = getPath(record, path);
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function readNumberFromTrip(
  record: Record<string, unknown> | null,
  summary: Record<string, unknown> | null,
  paths: string[],
) {
  if (record) {
    const value = readNumberFromRecord(record, paths);
    if (value !== undefined) return value;
  }
  if (summary) {
    const value = readNumberFromRecord(summary, paths);
    if (value !== undefined) return value;
  }
  return undefined;
}

function litersToGallons(value: number) {
  return value / 3.785411784;
}

function readFuelGallonsFromTrip(
  record: Record<string, unknown> | null,
  summary: Record<string, unknown> | null,
  paths: { gallons: string[]; liters: string[] },
) {
  const gallons = readNumberFromTrip(record, summary, paths.gallons);
  if (gallons !== undefined) return gallons;
  const liters = readNumberFromTrip(record, summary, paths.liters);
  if (liters !== undefined) return litersToGallons(liters);
  return undefined;
}

function readStringFromTrip(
  record: Record<string, unknown> | null,
  summary: Record<string, unknown> | null,
  paths: string[],
) {
  if (record) {
    for (const path of paths) {
      const value = getPath(record, path);
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  if (summary) {
    for (const path of paths) {
      const value = getPath(summary, path);
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return undefined;
}

function parseHmsToSeconds(value?: string) {
  if (!value) return undefined;
  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return undefined;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return undefined;
}

function formatSecondsAsDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "NA";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function sumOptional(a?: number, b?: number) {
  if (a === undefined && b === undefined) return undefined;
  return (a ?? 0) + (b ?? 0);
}

function formatDuration(startTime: string, endTime: string) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "--";
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDurationDetailed(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return "NA";
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return "NA";
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function minutesBetween(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return undefined;
  const start = new Date(startTime);
  const end = new Date(endTime);
  const ms = end.getTime() - start.getTime();
  if (Number.isNaN(ms) || ms <= 0) return undefined;
  return Math.round(ms / 60000);
}

function formatMinutes(totalMinutes: number) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return "--";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function formatDateTime(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const year = `${date.getFullYear()}`;
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  const seconds = `${date.getSeconds()}`.padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

function formatOptionalNumber(
  value: number | null | undefined,
  decimals: number,
  suffix = "",
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "NA";
  return `${value.toFixed(decimals)}${suffix}`;
}

function rangeLabel(value: string) {
  if (value === "today") return "today";
  if (value === "last7") return "last 7d";
  if (value === "last30") return "last 30d";
  if (value === "last90") return "last 90d";
  if (value === "custom") return "custom";
  return value;
}
