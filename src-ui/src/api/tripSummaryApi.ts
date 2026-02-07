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
}: TripSummaryQuery): Promise<TripSummaryResponse> {
  const params = new URLSearchParams();
  params.set("tenantId", tenantId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", String(limit));
  if (vehicleIds && vehicleIds.length > 0) {
    params.set("vehicleIds", vehicleIds.join(","));
  }

  const path = fleetId
    ? `/fleets/${fleetId}/trips?${params.toString()}`
    : `/trips?${new URLSearchParams({
        ...Object.fromEntries(params),
        ...(vin ? { vehicleId: vin } : {}),
      }).toString()}`;

  return httpRequest<TripSummaryResponse>(path, {
    baseUrl: tripSummaryBaseUrl,
    headers: {
      ...(tripSummaryApiKey ? { "x-api-key": tripSummaryApiKey } : {}),
      "x-tenant-id": tenantId,
    },
  });
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
