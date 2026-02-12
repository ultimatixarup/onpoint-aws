import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GeofenceDraft, useGeofenceStore } from "./geofenceStore";

type MemoryStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createMemoryStorage(): MemoryStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

function createDraft(overrides: Partial<GeofenceDraft> = {}): GeofenceDraft {
  return {
    name: "Warehouse West",
    description: "Primary depot",
    type: "CIRCLE",
    status: "ACTIVE",
    tenantId: "tenant-a",
    fleetId: "fleet-1",
    shape: {
      type: "CIRCLE",
      center: [32.7157, -117.1611],
      radiusMeters: 250,
    },
    ...overrides,
  };
}

describe("useGeofenceStore", () => {
  beforeEach(() => {
    Object.defineProperty(window, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
    });
    window.localStorage.clear();
    if (globalThis.crypto && "randomUUID" in globalThis.crypto) {
      vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
        "00000000-0000-4000-8000-000000000000",
      );
    }
  });

  it("creates geofences and persists them per tenant", () => {
    const { result } = renderHook(() => useGeofenceStore("tenant-a"));

    act(() => {
      result.current.createGeofence(createDraft());
    });

    expect(result.current.geofences).toHaveLength(1);
    expect(result.current.geofences[0].id).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
    expect(result.current.geofences[0].alerts.enter).toBe(false);
    expect(
      JSON.parse(window.localStorage.getItem("onpoint.geofences.tenant-a") ??
        "[]"),
    ).toHaveLength(1);
  });

  it("updates alert configuration while preserving defaults", () => {
    const { result } = renderHook(() => useGeofenceStore("tenant-a"));

    act(() => {
      result.current.createGeofence(createDraft());
    });

    act(() => {
      result.current.updateGeofence("00000000-0000-4000-8000-000000000000", {
        alerts: {
          enter: true,
          exit: false,
          dwell: true,
          channels: {
            email: true,
            sms: false,
            webhook: true,
          },
        },
      });
    });

    const updated = result.current.geofences[0];
    expect(updated.alerts.enter).toBe(true);
    expect(updated.alerts.dwell).toBe(true);
    expect(updated.alerts.channels.email).toBe(true);
    expect(updated.alerts.channels.sms).toBe(false);
  });

  it("removes geofences and clears storage", () => {
    const { result } = renderHook(() => useGeofenceStore("tenant-a"));

    act(() => {
      result.current.createGeofence(createDraft());
    });

    act(() => {
      result.current.removeGeofence("00000000-0000-4000-8000-000000000000");
    });

    expect(result.current.geofences).toHaveLength(0);
    expect(
      JSON.parse(window.localStorage.getItem("onpoint.geofences.tenant-a") ??
        "[]"),
    ).toHaveLength(0);
  });

  it("isolates storage per tenant", () => {
    const storeA = renderHook(() => useGeofenceStore("tenant-a"));
    const storeB = renderHook(() => useGeofenceStore("tenant-b"));

    act(() => {
      storeA.result.current.createGeofence(createDraft());
    });

    expect(storeA.result.current.geofences).toHaveLength(1);
    expect(storeB.result.current.geofences).toHaveLength(0);
  });
});
