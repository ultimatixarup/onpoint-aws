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

type TripSummaryQuery = {
  tenantId: string;
  fleetId?: string;
  vin?: string;
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
  from,
  to,
  limit = 50,
}: TripSummaryQuery): Promise<TripSummaryResponse> {
  const params = new URLSearchParams();
  params.set("tenantId", tenantId);
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (limit) params.set("limit", String(limit));

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
