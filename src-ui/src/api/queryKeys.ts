export const queryKeys = {
  fleets: (tenantId: string) => ["fleets", tenantId] as const,
  trips: (tenantId: string, fleetId?: string) => ["trips", tenantId, fleetId] as const
};
