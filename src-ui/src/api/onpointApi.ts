import { httpRequest } from "./httpClient";

export type FleetSummary = {
  fleetId: string;
  name: string;
  vehicleCount: number;
  customerId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  policies?: Record<string, unknown> | null;
};

export type CustomerSummary = {
  customerId: string;
  name?: string;
  status?: string;
  tenantId?: string;
};

export type TenantSummary = {
  id: string;
  name: string;
  status?: string;
};

export type VehicleSummary = {
  vin: string;
  status?: string;
  fleetId?: string;
  make?: string;
  model?: string;
  year?: number;
};

export type DriverSummary = {
  driverId: string;
  name?: string;
  status?: string;
  fleetId?: string;
  customerId?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown> | null;
  email?: string;
  phone?: string;
};

export type VehicleState = {
  vin: string;
  lastEventTime?: string;
  lat?: number;
  lon?: number;
  heading?: number;
  speed_mph?: number;
  odometer_miles?: number;
  vehicleState?: string;
  ignition_status?: string;
};

export type UserSummary = {
  userId: string;
  email?: string;
  groups?: string[];
  roles?: string[];
  name?: string;
  status?: string;
  enabled?: boolean;
};

function mapTenant(record: Record<string, unknown>): TenantSummary | undefined {
  const id = record.tenantId ?? record.id ?? record.tenantID;
  if (!id) return undefined;
  const name = record.name ?? record.displayName ?? record.tenantName ?? id;
  const status = record.status;
  return {
    id: String(id),
    name: String(name),
    status: status ? String(status) : undefined,
  };
}

export async function fetchTenants(
  params: {
    tenantId?: string;
    isAdmin?: boolean;
  } = {},
) {
  if (params.isAdmin) {
    const response = await httpRequest<unknown>("/tenants");
    const items = Array.isArray(response)
      ? response
      : typeof response === "object" &&
          response !== null &&
          Array.isArray((response as { items?: unknown[] }).items)
        ? (response as { items: unknown[] }).items
        : [];

    const mapped = items
      .map((item) => mapTenant(item as Record<string, unknown>))
      .filter((item): item is TenantSummary => Boolean(item))
      .filter((item) => item.status?.toUpperCase() !== "DELETED");

    const unique = new Map<string, TenantSummary>();
    for (const tenant of mapped) {
      if (!unique.has(tenant.id)) {
        unique.set(tenant.id, tenant);
      }
    }
    return Array.from(unique.values());
  }

  if (!params.tenantId) return [];

  // For non-admin users, try to fetch tenant details, but if it fails,
  // fall back to creating a minimal tenant object from the tenantId
  try {
    const response = await httpRequest<unknown>(`/tenants/${params.tenantId}`);
    const tenant =
      typeof response === "object" && response !== null
        ? mapTenant(response as Record<string, unknown>)
        : undefined;
    if (!tenant) {
      return [{ id: params.tenantId, name: params.tenantId, status: "ACTIVE" }];
    }
    if (tenant.status?.toUpperCase() === "DELETED") return [];
    return [tenant];
  } catch (error) {
    console.warn(
      "Failed to fetch tenant details, using minimal tenant object",
      error,
    );
    return [{ id: params.tenantId, name: params.tenantId, status: "ACTIVE" }];
  }
}

export async function fetchFleets(tenantId: string) {
  const response = await httpRequest<unknown>(`/fleets?tenantId=${tenantId}`, {
    headers: { "x-tenant-id": tenantId },
  });
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];

  const fleets = items.map((item): FleetSummary | undefined => {
    const record = item as Record<string, unknown>;
    const fleetId = record.fleetId ?? record.id;
    if (!fleetId) return undefined;
    const name = record.name ?? record.displayName ?? fleetId;
    const vehicleCount = Number(record.vehicleCount ?? 0);
    return {
      fleetId: String(fleetId),
      name: String(name),
      vehicleCount,
      customerId: record.customerId ? String(record.customerId) : undefined,
      status: record.status ? String(record.status) : undefined,
      createdAt: record.createdAt ? String(record.createdAt) : undefined,
      updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
      policies:
        typeof record.policies === "object" || record.policies === null
          ? (record.policies as Record<string, unknown> | null)
          : undefined,
    };
  });
  return fleets.filter(Boolean) as FleetSummary[];
}

export async function createTenant(payload: {
  tenantId?: string;
  name: string;
  config?: Record<string, unknown>;
  reason?: string;
}) {
  return httpRequest<unknown>("/tenants", {
    method: "POST",
    body: payload,
  });
}

export async function updateTenant(
  tenantId: string,
  payload: {
    name?: string;
    status?: string;
    config?: Record<string, unknown>;
    reason?: string;
  },
) {
  return httpRequest<unknown>(`/tenants/${tenantId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function fetchCustomers(tenantId: string) {
  const response = await httpRequest<unknown>(
    `/customers?tenantId=${tenantId}`,
    {
      headers: { "x-tenant-id": tenantId },
    },
  );
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];

  const customers = items.map((item): CustomerSummary | undefined => {
    const record = item as Record<string, unknown>;
    const customerId = record.customerId ?? record.id;
    if (!customerId) return undefined;
    return {
      customerId: String(customerId),
      name: record.name ? String(record.name) : undefined,
      status: record.status ? String(record.status) : undefined,
      tenantId: record.tenantId ? String(record.tenantId) : undefined,
    };
  });
  return customers.filter(Boolean) as CustomerSummary[];
}

export async function createCustomer(payload: {
  customerId?: string;
  tenantId: string;
  name?: string;
  reason?: string;
}) {
  return httpRequest<unknown>("/customers", {
    method: "POST",
    body: payload,
    headers: { "x-tenant-id": payload.tenantId },
  });
}

export async function updateCustomer(
  customerId: string,
  payload: {
    name?: string;
    status?: string;
    reason?: string;
  },
) {
  return httpRequest<unknown>(`/customers/${customerId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function createFleet(payload: {
  fleetId?: string;
  tenantId: string;
  customerId?: string;
  name?: string;
  reason?: string;
}) {
  return httpRequest<unknown>("/fleets", {
    method: "POST",
    body: payload,
    headers: { "x-tenant-id": payload.tenantId },
  });
}

export async function updateFleet(
  fleetId: string,
  payload: {
    policies?: Record<string, unknown>;
    reason?: string;
  },
) {
  return httpRequest<unknown>(`/fleets/${fleetId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function fetchTrips(tenantId: string, fleetId?: string) {
  const fleetQuery = fleetId ? `?fleetId=${fleetId}` : "";
  return httpRequest<unknown[]>(`/tenants/${tenantId}/trips${fleetQuery}`);
}

export async function fetchVehicles(tenantId: string, fleetId?: string) {
  const query = new URLSearchParams({ tenantId });
  if (fleetId) query.set("fleetId", fleetId);

  const response = await httpRequest<unknown>(`/vehicles?${query.toString()}`, {
    headers: {
      "x-tenant-id": tenantId,
      ...(fleetId ? { "x-fleet-id": fleetId } : {}),
    },
  });

  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];

  const vehicles = items.map((item): VehicleSummary | undefined => {
    const record = item as Record<string, unknown>;
    const pkValue = record.PK;
    const vinFromPk =
      typeof pkValue === "string" && pkValue.startsWith("VEHICLE#")
        ? pkValue.split("VEHICLE#")[1]
        : undefined;
    const vin = record.vin ?? record.VIN ?? record.id ?? vinFromPk;
    if (!vin) return undefined;
    const yearValue = record.year ?? record.modelYear;
    const year = yearValue ? Number(yearValue) : undefined;
    return {
      vin: String(vin),
      status: record.status ? String(record.status) : undefined,
      fleetId: record.fleetId ? String(record.fleetId) : undefined,
      make: record.make ? String(record.make) : undefined,
      model: record.model ? String(record.model) : undefined,
      year: Number.isNaN(year) ? undefined : year,
    };
  });
  return vehicles.filter(Boolean) as VehicleSummary[];
}

export async function createVehicle(payload: {
  vin: string;
  make?: string;
  model?: string;
  year?: number | string;
  status?: string;
  reason?: string;
}) {
  return httpRequest<unknown>("/vehicles", {
    method: "POST",
    body: payload,
  });
}

export async function updateVehicle(
  vin: string,
  payload: {
    status?: string;
    metadata?: Record<string, unknown>;
    assetTags?: string[];
  },
) {
  return httpRequest<unknown>(`/vehicles/${vin}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function fetchDrivers(tenantId: string, fleetId?: string) {
  const query = new URLSearchParams({ tenantId });
  if (fleetId) query.set("fleetId", fleetId);

  const response = await httpRequest<unknown>(`/drivers?${query.toString()}`, {
    headers: {
      "x-tenant-id": tenantId,
      ...(fleetId ? { "x-fleet-id": fleetId } : {}),
    },
  });

  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];

  const drivers = items.map((item): DriverSummary | undefined => {
    const record = item as Record<string, unknown>;
    const driverId = record.driverId ?? record.id ?? record.userId;
    if (!driverId) return undefined;
    const metadata =
      typeof record.metadata === "object" || record.metadata === null
        ? (record.metadata as Record<string, unknown> | null)
        : undefined;
    const name =
      record.name ?? record.displayName ?? record.fullName ?? metadata?.name;
    const status = record.status ?? record.state;
    return {
      driverId: String(driverId),
      name: name ? String(name) : undefined,
      status: status ? String(status) : undefined,
      fleetId: record.fleetId ? String(record.fleetId) : undefined,
      customerId: record.customerId ? String(record.customerId) : undefined,
      createdAt: record.createdAt ? String(record.createdAt) : undefined,
      updatedAt: record.updatedAt ? String(record.updatedAt) : undefined,
      metadata,
      email: record.email ? String(record.email) : undefined,
      phone: record.phone ? String(record.phone) : undefined,
    };
  });
  return drivers.filter(Boolean) as DriverSummary[];
}

export async function createDriver(payload: {
  driverId?: string;
  tenantId: string;
  fleetId?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}) {
  return httpRequest<unknown>("/drivers", {
    method: "POST",
    body: payload,
    headers: { "x-tenant-id": payload.tenantId },
  });
}

export async function updateDriver(
  driverId: string,
  payload: {
    fleetId?: string;
    customerId?: string;
    metadata?: Record<string, unknown>;
    reason?: string;
  },
) {
  return httpRequest<unknown>(`/drivers/${driverId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function fetchUsers(tenantId: string, fleetId?: string) {
  const query = new URLSearchParams({ tenantId });
  if (fleetId) query.set("fleetId", fleetId);

  const response = await httpRequest<unknown>(
    `/tenants/${tenantId}/users?${query.toString()}`,
    {
      headers: {
        "x-tenant-id": tenantId,
        ...(fleetId ? { "x-fleet-id": fleetId } : {}),
      },
    },
  );
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];

  const users = items.map((item): UserSummary | undefined => {
    const record = item as Record<string, unknown>;
    const userId = record.userId ?? record.id ?? record.email;
    if (!userId) return undefined;
    const groups = Array.isArray(record.groups)
      ? record.groups.map((g) => String(g))
      : undefined;
    const roles = Array.isArray(record.roles)
      ? record.roles.map((role) => String(role))
      : groups;
    const statusValue = record.status ? String(record.status) : undefined;
    const enabledValue =
      typeof record.enabled === "boolean"
        ? record.enabled
        : statusValue
          ? ["ENABLED", "ACTIVE"].includes(statusValue.toUpperCase())
          : undefined;

    const attributes = Array.isArray(record.attributes)
      ? (record.attributes as Array<{ Name?: string; Value?: string }>)
      : undefined;
    const attributeMap = attributes
      ? Object.fromEntries(
          attributes
            .filter((attr) => attr.Name)
            .map((attr) => [String(attr.Name), String(attr.Value ?? "")]),
        )
      : undefined;

    const nameValue =
      record.name ??
      record.fullName ??
      record.displayName ??
      record.userName ??
      record.username ??
      attributeMap?.name ??
      attributeMap?.given_name ??
      attributeMap?.preferred_username;

    const rawEmail =
      record.email ??
      attributeMap?.email ??
      (typeof userId === "string" && userId.includes("@") ? userId : undefined);
    const emailValue = typeof rawEmail === "string" ? rawEmail : undefined;

    const fallbackName =
      !nameValue && emailValue
        ? emailValue
            .split("@")[0]
            .replace(/[._-]+/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : undefined;

    return {
      userId: String(userId),
      email: emailValue ? String(emailValue) : undefined,
      groups,
      roles,
      name: nameValue ? String(nameValue) : fallbackName,
      status: statusValue,
      enabled: enabledValue,
    };
  });
  return users.filter(Boolean) as UserSummary[];
}

const vehicleStateBaseUrl =
  import.meta.env.VITE_VEHICLE_STATE_BASE_URL ?? "/vehicle-state";
const vehicleStateApiKey =
  import.meta.env.VITE_VEHICLE_STATE_API_KEY ??
  import.meta.env.VITE_ONPOINT_API_KEY ??
  "";

export async function fetchFleetVehicleStates(
  tenantId: string,
  fleetId: string,
  range?: { from?: string; to?: string; range?: string },
): Promise<VehicleState[]> {
  const params = new URLSearchParams();
  if (range?.range) params.set("range", range.range);
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  if (tenantId) params.set("tenantId", tenantId);

  const path = `/fleets/${fleetId}/vehicles/state?${params.toString()}`;
  const response = await httpRequest<unknown>(path, {
    baseUrl: vehicleStateBaseUrl,
    headers: {
      ...(vehicleStateApiKey ? { "x-api-key": vehicleStateApiKey } : {}),
      "x-tenant-id": tenantId,
    },
  });

  const items =
    typeof response === "object" && response !== null
      ? ((response as { items?: unknown[] }).items ?? [])
      : [];

  const vehicleStates = items.map((item): VehicleState | undefined => {
    const record = item as Record<string, unknown>;
    const pkValue = record.PK;
    const vinFromPk =
      typeof pkValue === "string" && pkValue.startsWith("VEHICLE#")
        ? pkValue.slice("VEHICLE#".length)
        : undefined;
    const vin = record.vin ?? record.VIN ?? record.id ?? vinFromPk;
    if (!vin) return undefined;
    const latValue = record.lat ?? record.latitude;
    const lonValue = record.lon ?? record.longitude;
    const lat = typeof latValue === "number" ? latValue : Number(latValue);
    const lon = typeof lonValue === "number" ? lonValue : Number(lonValue);
    const headingValue = record.heading;
    const speedValue = record.speed_mph ?? record.speedMph;
    const odometerValue = record.odometer_miles ?? record.odometerMiles;
    return {
      vin: String(vin),
      lastEventTime: record.lastEventTime
        ? String(record.lastEventTime)
        : undefined,
      lat: Number.isNaN(lat) ? undefined : lat,
      lon: Number.isNaN(lon) ? undefined : lon,
      heading:
        typeof headingValue === "number" ? headingValue : Number(headingValue),
      speed_mph:
        typeof speedValue === "number" ? speedValue : Number(speedValue),
      odometer_miles:
        typeof odometerValue === "number"
          ? odometerValue
          : Number(odometerValue),
      vehicleState: record.vehicleState
        ? String(record.vehicleState)
        : undefined,
      ignition_status: record.ignition_status
        ? String(record.ignition_status)
        : undefined,
    };
  });
  return vehicleStates.filter(Boolean) as VehicleState[];
}

export async function createTenantUser(
  tenantId: string,
  payload: {
    email: string;
    roles?: string[];
    name?: string;
  },
) {
  return httpRequest<unknown>(`/tenants/${tenantId}/users`, {
    method: "POST",
    body: payload,
    headers: { "x-tenant-id": tenantId },
  });
}

export async function createTenantAdmin(
  tenantId: string,
  payload: {
    email: string;
    name?: string;
  },
) {
  return httpRequest<unknown>(`/platform/tenants/${tenantId}/admins`, {
    method: "POST",
    body: payload,
    headers: { "x-tenant-id": tenantId },
  });
}

export async function updateUserRoles(
  tenantId: string,
  userId: string,
  roles: string[],
) {
  return httpRequest<unknown>(`/tenants/${tenantId}/users/${userId}/roles`, {
    method: "PUT",
    body: { roles },
    headers: { "x-tenant-id": tenantId },
  });
}

export async function setUserStatus(
  tenantId: string,
  userId: string,
  enabled: boolean,
) {
  return httpRequest<unknown>(
    `/tenants/${tenantId}/users/${userId}/${enabled ? "enable" : "disable"}`,
    {
      method: "POST",
      headers: { "x-tenant-id": tenantId },
    },
  );
}

export async function assignVin(
  payload: {
    vin: string;
    tenantId: string;
    fleetId?: string;
    customerId?: string;
    effectiveFrom: string;
    effectiveTo?: string;
    reason: string;
  },
  idempotencyKey: string,
) {
  return httpRequest<unknown>("/vin-registry/assign", {
    method: "POST",
    body: payload,
    headers: {
      "x-tenant-id": payload.tenantId,
      "idempotency-key": idempotencyKey,
    },
  });
}

export async function createDriverAssignment(
  driverId: string,
  payload: {
    vin: string;
    tenantId: string;
    effectiveFrom: string;
    effectiveTo?: string;
    assignmentType?: string;
    reason?: string;
  },
  idempotencyKey: string,
) {
  return httpRequest<unknown>(`/drivers/${driverId}/assignments`, {
    method: "POST",
    body: payload,
    headers: {
      "x-tenant-id": payload.tenantId,
      "idempotency-key": idempotencyKey,
    },
  });
}

export async function fetchDriverAssignments(
  driverId: string,
  tenantId?: string,
) {
  return httpRequest<unknown>(`/drivers/${driverId}/assignments`, {
    headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
  });
}

export async function fetchVehicleAssignments(vin: string, tenantId?: string) {
  return httpRequest<unknown>(`/vehicles/${vin}/driver-assignments`, {
    headers: tenantId ? { "x-tenant-id": tenantId } : undefined,
  });
}
