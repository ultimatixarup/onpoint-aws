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
  const response = await httpRequest<unknown>(`/tenants/${params.tenantId}`);
  const tenant =
    typeof response === "object" && response !== null
      ? mapTenant(response as Record<string, unknown>)
      : undefined;
  if (!tenant) return [];
  if (tenant.status?.toUpperCase() === "DELETED") return [];
  return [tenant];
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

  return items
    .map((item) => {
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
    })
    .filter((item): item is FleetSummary => Boolean(item));
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

  return items
    .map((item) => {
      const record = item as Record<string, unknown>;
      const customerId = record.customerId ?? record.id;
      if (!customerId) return undefined;
      return {
        customerId: String(customerId),
        name: record.name ? String(record.name) : undefined,
        status: record.status ? String(record.status) : undefined,
        tenantId: record.tenantId ? String(record.tenantId) : undefined,
      };
    })
    .filter((item): item is CustomerSummary => Boolean(item));
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

  return items
    .map((item) => {
      const record = item as Record<string, unknown>;
      const vin = record.vin ?? record.VIN ?? record.id;
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
    })
    .filter((item): item is VehicleSummary => Boolean(item));
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

  return items
    .map((item) => {
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
    })
    .filter((item): item is DriverSummary => Boolean(item));
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

export async function fetchUsers(tenantId: string) {
  const response = await httpRequest<unknown>(`/tenants/${tenantId}/users`, {
    headers: { "x-tenant-id": tenantId },
  });
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];

  return items
    .map((item) => {
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

      const emailValue =
        record.email ??
        attributeMap?.email ??
        (typeof userId === "string" && userId.includes("@")
          ? userId
          : undefined);

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
    })
    .filter((item): item is UserSummary => Boolean(item));
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

export async function fetchDriverAssignments(driverId: string) {
  return httpRequest<unknown>(`/drivers/${driverId}/assignments`);
}

export async function fetchVehicleAssignments(vin: string) {
  return httpRequest<unknown>(`/vehicles/${vin}/driver-assignments`);
}
