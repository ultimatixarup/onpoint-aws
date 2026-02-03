import { httpRequest } from "./httpClient";

export type FleetSummary = {
  fleetId: string;
  name: string;
  vehicleCount: number;
};

export async function fetchFleets(tenantId: string) {
  return httpRequest<FleetSummary[]>(`/tenants/${tenantId}/fleets`);
}

export async function fetchTrips(tenantId: string, fleetId?: string) {
  const fleetQuery = fleetId ? `?fleetId=${fleetId}` : "";
  return httpRequest<unknown[]>(`/tenants/${tenantId}/trips${fleetQuery}`);
}
