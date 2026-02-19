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

type TripSummaryQuery = {
  tenantId: string;
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
      "x-tenant-id": tenantId,
    },
  });

  return {
    ...response,
    items: (response.items ?? []).map(normalizeTripSummaryItem),
  };
}

export async function fetchTripEvents(params: {
  tenantId: string;
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
      "x-tenant-id": params.tenantId,
    },
  });
}
