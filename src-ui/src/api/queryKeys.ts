export const queryKeys = {
  tenants: (tenantId?: string, isAdmin?: boolean) =>
    ["tenants", tenantId ?? "none", isAdmin ? "admin" : "user"] as const,
  customers: (tenantId: string) => ["customers", tenantId] as const,
  fleets: (tenantId: string) => ["fleets", tenantId] as const,
  vehicles: (tenantId: string, fleetId?: string) =>
    ["vehicles", tenantId, fleetId ?? "all"] as const,
  drivers: (tenantId: string, fleetId?: string) =>
    ["drivers", tenantId, fleetId ?? "all"] as const,
  users: (tenantId: string) => ["users", tenantId] as const,
  driverAssignments: (driverId: string) =>
    ["driver-assignments", driverId] as const,
  vehicleAssignments: (vin: string) => ["vehicle-assignments", vin] as const,
  trips: (tenantId: string, fleetId?: string) =>
    ["trips", tenantId, fleetId] as const,
  tripSummary: (tenantId: string, fleetId?: string, vin?: string) =>
    ["trip-summary", tenantId, fleetId ?? "all", vin ?? "all"] as const,
};
