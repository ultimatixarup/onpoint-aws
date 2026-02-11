import { useCallback, useEffect, useMemo, useState } from "react";

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

export function useGeofenceStore(tenantId?: string) {
  const [geofences, setGeofences] = useState<GeofenceRecord[]>(() =>
    loadGeofences(tenantId),
  );

  useEffect(() => {
    setGeofences(loadGeofences(tenantId));
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
        saveGeofences(tenantId, next);
        return next;
      });
    },
    [tenantId],
  );

  const removeGeofence = useCallback(
    (id: string) => {
      setGeofences((current) => {
        const next = current.filter((item) => item.id !== id);
        saveGeofences(tenantId, next);
        return next;
      });
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
