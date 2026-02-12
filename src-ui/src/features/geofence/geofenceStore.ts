import { useCallback, useEffect, useMemo, useState } from "react";
import { httpRequest } from "../../api/httpClient";

export type GeofenceType = "CIRCLE" | "POLYGON" | "RECTANGLE" | "POINT";

export type GeofenceShape = {
  type: GeofenceType;
  coordinates?: Array<[number, number]>;
  center?: [number, number];
  radiusMeters?: number;
};

export type GeofenceAlertConfig = {
  enter: boolean;
  exit: boolean;
  dwell: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
};

export type GeofenceRecord = {
  id: string;
  name: string;
  description?: string;
  type: GeofenceType;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt?: string;
  tenantId?: string;
  fleetId?: string;
  shape: GeofenceShape;
  alerts: GeofenceAlertConfig;
};

export type GeofenceDraft = {
  name: string;
  description?: string;
  type: GeofenceType;
  status: "ACTIVE" | "INACTIVE";
  tenantId?: string;
  fleetId?: string;
  shape: GeofenceShape;
};

const DEFAULT_ALERTS: GeofenceAlertConfig = {
  enter: false,
  exit: false,
  dwell: false,
  channels: {
    email: false,
    sms: false,
    webhook: false,
  },
};

const GEOFENCE_BASE_URL = import.meta.env.VITE_GEOFENCE_BASE_URL as
  | string
  | undefined;
const GEOFENCE_API_KEY =
  ((import.meta.env.VITE_GEOFENCE_API_KEY as string | undefined) ??
    (import.meta.env.VITE_ONPOINT_API_KEY as string | undefined)) ||
  undefined;
const GEOFENCE_ROLE_OVERRIDE =
  ((import.meta.env.VITE_GEOFENCE_ROLE_OVERRIDE as string | undefined) ??
    (import.meta.env.VITE_ONPOINT_ROLE_OVERRIDE as string | undefined)) ||
  undefined;
const USE_GEOFENCE_API = Boolean(GEOFENCE_BASE_URL);

function getStorageKey(tenantId?: string) {
  return `onpoint.geofences.${tenantId ?? "global"}`;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `gf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeRecord(record: GeofenceRecord): GeofenceRecord {
  return {
    ...record,
    alerts: {
      ...DEFAULT_ALERTS,
      ...(record.alerts ?? {}),
      channels: {
        ...DEFAULT_ALERTS.channels,
        ...(record.alerts?.channels ?? {}),
      },
    },
  };
}

function loadGeofences(tenantId?: string) {
  if (typeof window === "undefined") return [] as GeofenceRecord[];
  const key = getStorageKey(tenantId);
  const raw = window.localStorage.getItem(key);
  if (!raw) return [] as GeofenceRecord[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [] as GeofenceRecord[];
    return parsed
      .map((item) => (item ? normalizeRecord(item) : undefined))
      .filter(Boolean) as GeofenceRecord[];
  } catch (error) {
    console.warn("Unable to parse geofences from storage", error);
    return [] as GeofenceRecord[];
  }
}

function saveGeofences(tenantId: string | undefined, items: GeofenceRecord[]) {
  if (typeof window === "undefined") return;
  const key = getStorageKey(tenantId);
  window.localStorage.setItem(key, JSON.stringify(items));
}

type GeofenceApiItem = {
  geofenceId?: string;
  tenantId?: string;
  type?: GeofenceType;
  status?: "ACTIVE" | "INACTIVE" | "DELETED";
  geometry?: GeofenceShape & Record<string, unknown>;
  name?: string;
  description?: string;
  fleetId?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: Record<string, unknown> | null;
};

function mapApiItem(item: GeofenceApiItem): GeofenceRecord | undefined {
  const id = item.geofenceId ?? (item as { id?: string }).id;
  if (!id) return undefined;
  if (item.status === "DELETED") return undefined;
  const geometry = item.geometry ?? (item as { shape?: GeofenceShape }).shape;
  const type = item.type ?? geometry?.type;
  if (!type) return undefined;
  const name =
    item.name ??
    (item.tags && typeof item.tags === "object"
      ? (item.tags as Record<string, unknown>).name
      : undefined) ??
    String(id);
  const description =
    item.description ??
    (item.tags && typeof item.tags === "object"
      ? (item.tags as Record<string, unknown>).description
      : undefined);
  const fleetId =
    item.fleetId ??
    (item.tags && typeof item.tags === "object"
      ? (item.tags as Record<string, unknown>).fleetId
      : undefined);

  const shape: GeofenceShape = {
    type,
    center: geometry?.center,
    radiusMeters: geometry?.radiusMeters,
    coordinates: geometry?.coordinates,
  };

  return normalizeRecord({
    id: String(id),
    name: String(name),
    description: description ? String(description) : undefined,
    type,
    status: (item.status ?? "ACTIVE") as GeofenceRecord["status"],
    createdAt: item.createdAt ?? new Date().toISOString(),
    updatedAt: item.updatedAt,
    tenantId: item.tenantId,
    fleetId: fleetId ? String(fleetId) : undefined,
    shape,
    alerts: DEFAULT_ALERTS,
  });
}

async function fetchGeofencesFromApi(tenantId: string) {
  const response = await httpRequest<{ items?: GeofenceApiItem[] }>(
    "/geofences",
    {
      baseUrl: GEOFENCE_BASE_URL,
      headers: {
        "x-tenant-id": tenantId,
        ...(GEOFENCE_API_KEY ? { "x-api-key": GEOFENCE_API_KEY } : {}),
        ...(GEOFENCE_ROLE_OVERRIDE ? { "x-role": GEOFENCE_ROLE_OVERRIDE } : {}),
      },
    },
  );
  const items = Array.isArray(response)
    ? (response as GeofenceApiItem[])
    : response?.items ?? [];
  return items
    .map((item) => mapApiItem(item))
    .filter(Boolean) as GeofenceRecord[];
}

async function createGeofenceApi(
  tenantId: string,
  draft: GeofenceDraft,
): Promise<GeofenceRecord> {
  const payload = {
    name: draft.name,
    description: draft.description,
    type: draft.type,
    status: draft.status,
    fleetId: draft.fleetId,
    geometry: draft.shape,
    createdBy: "ui",
  };
  const item = await httpRequest<GeofenceApiItem>("/geofences", {
    method: "POST",
    baseUrl: GEOFENCE_BASE_URL,
    headers: {
      "x-tenant-id": tenantId,
      ...(GEOFENCE_API_KEY ? { "x-api-key": GEOFENCE_API_KEY } : {}),
      ...(GEOFENCE_ROLE_OVERRIDE ? { "x-role": GEOFENCE_ROLE_OVERRIDE } : {}),
    },
    body: payload,
  });
  const mapped = mapApiItem(item);
  if (!mapped) {
    throw new Error("Invalid geofence response");
  }
  return mapped;
}

async function updateGeofenceApi(
  tenantId: string,
  geofence: GeofenceRecord,
): Promise<GeofenceRecord> {
  const payload = {
    name: geofence.name,
    description: geofence.description,
    type: geofence.type,
    status: geofence.status,
    fleetId: geofence.fleetId,
    geometry: geofence.shape,
    updatedBy: "ui",
  };
  const item = await httpRequest<GeofenceApiItem>(
    `/geofences/${geofence.id}`,
    {
      method: "PUT",
      baseUrl: GEOFENCE_BASE_URL,
      headers: {
        "x-tenant-id": tenantId,
        ...(GEOFENCE_API_KEY ? { "x-api-key": GEOFENCE_API_KEY } : {}),
        ...(GEOFENCE_ROLE_OVERRIDE ? { "x-role": GEOFENCE_ROLE_OVERRIDE } : {}),
      },
      body: payload,
    },
  );
  const mapped = mapApiItem(item);
  if (!mapped) {
    throw new Error("Invalid geofence response");
  }
  return mapped;
}

async function deleteGeofenceApi(tenantId: string, geofenceId: string) {
  await httpRequest<unknown>(`/geofences/${geofenceId}`, {
    method: "DELETE",
    baseUrl: GEOFENCE_BASE_URL,
    headers: {
      "x-tenant-id": tenantId,
      ...(GEOFENCE_API_KEY ? { "x-api-key": GEOFENCE_API_KEY } : {}),
      ...(GEOFENCE_ROLE_OVERRIDE ? { "x-role": GEOFENCE_ROLE_OVERRIDE } : {}),
    },
  });
}

export function useGeofenceStore(tenantId?: string) {
  const [geofences, setGeofences] = useState<GeofenceRecord[]>(() =>
    loadGeofences(tenantId),
  );

  useEffect(() => {
    let active = true;
    if (USE_GEOFENCE_API && tenantId) {
      fetchGeofencesFromApi(tenantId)
        .then((items) => {
          if (active) setGeofences(items);
        })
        .catch((error) => {
          console.warn("Failed to load geofences from API", error);
          if (active) setGeofences(loadGeofences(tenantId));
        });
      return () => {
        active = false;
      };
    }
    setGeofences(loadGeofences(tenantId));
    return () => {
      active = false;
    };
  }, [tenantId]);

  const createGeofence = useCallback(
    (draft: GeofenceDraft) => {
      const now = new Date().toISOString();
      const record: GeofenceRecord = normalizeRecord({
        id: createId(),
        name: draft.name,
        description: draft.description,
        type: draft.type,
        status: draft.status,
        createdAt: now,
        updatedAt: now,
        tenantId: draft.tenantId,
        fleetId: draft.fleetId,
        shape: draft.shape,
        alerts: DEFAULT_ALERTS,
      });

      if (USE_GEOFENCE_API && tenantId) {
        setGeofences((current) => [...current, record]);
        createGeofenceApi(tenantId, draft)
          .then((created) => {
            setGeofences((current) =>
              current.map((item) =>
                item.id === record.id ? created : item,
              ),
            );
          })
          .catch((error) => {
            console.error("Failed to create geofence via API", error);
            setGeofences((current) => {
              const next = current.filter((item) => item.id !== record.id);
              saveGeofences(tenantId, next);
              return next;
            });
          });
        return record;
      }

      setGeofences((current) => {
        const next = [...current, record];
        saveGeofences(tenantId, next);
        return next;
      });
      return record;
    },
    [tenantId],
  );

  const updateGeofence = useCallback(
    (id: string, update: Partial<GeofenceRecord>) => {
      setGeofences((current) => {
        const next = current.map((item) =>
          item.id === id
            ? normalizeRecord({
                ...item,
                ...update,
                alerts: {
                  ...item.alerts,
                  ...(update.alerts ?? {}),
                  channels: {
                    ...item.alerts.channels,
                    ...(update.alerts?.channels ?? {}),
                  },
                },
                updatedAt: new Date().toISOString(),
              })
            : item,
        );
        if (!USE_GEOFENCE_API) {
          saveGeofences(tenantId, next);
        }
        return next;
      });

      if (USE_GEOFENCE_API && tenantId) {
        const current = geofences.find((item) => item.id === id);
        if (!current) return;
        const merged = normalizeRecord({
          ...current,
          ...update,
          updatedAt: new Date().toISOString(),
        });
        updateGeofenceApi(tenantId, merged).catch((error) => {
          console.error("Failed to update geofence via API", error);
        });
      }
    },
    [tenantId, geofences],
  );

  const removeGeofence = useCallback(
    (id: string) => {
      setGeofences((current) => {
        const next = current.filter((item) => item.id !== id);
        if (!USE_GEOFENCE_API) {
          saveGeofences(tenantId, next);
        }
        return next;
      });
      if (USE_GEOFENCE_API && tenantId) {
        deleteGeofenceApi(tenantId, id).catch((error) => {
          console.error("Failed to delete geofence via API", error);
        });
      }
    },
    [tenantId],
  );

  const stats = useMemo(() => {
    const total = geofences.length;
    const active = geofences.filter((item) => item.status === "ACTIVE").length;
    const inactive = total - active;
    const byType = geofences.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] ?? 0) + 1;
      return acc;
    }, {});
    return { total, active, inactive, byType };
  }, [geofences]);

  return { geofences, createGeofence, updateGeofence, removeGeofence, stats };
}
