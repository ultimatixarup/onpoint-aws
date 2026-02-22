import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  assignVin,
  createVehicle,
  deleteVehicle,
  fetchFleets,
  fetchVehicleAssignments,
  fetchVehicles,
  fetchVinRegistryHistory,
  transferVin,
  updateVehicle,
  VinRegistryRecord,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../context/AuthContext";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { formatDate as formatAppDate } from "../../utils/date";
import { createIdempotencyKey } from "../../utils/id";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;
const VEHICLE_TYPE_OPTIONS = [
  "LIGHT_DUTY",
  "HEAVY_DUTY",
  "EV",
  "TRAILER",
] as const;
const BODY_TYPE_OPTIONS = ["SEDAN", "SUV", "BOX_TRUCK", "TRACTOR"] as const;
const FUEL_TYPE_OPTIONS = ["GAS", "DIESEL", "EV", "HYBRID"] as const;
const ENGINE_TYPE_OPTIONS = ["V6", "V8", "ELECTRIC"] as const;
const TRANSMISSION_OPTIONS = ["AUTOMATIC", "MANUAL"] as const;
const VEHICLE_MAKE_OPTIONS = [
  "Toyota",
  "Ford",
  "Stellantis",
  "GMC",
  "Tesla",
  "Dongle",
] as const;

function normalizeStatus(value?: string) {
  return (value ?? "unknown").toLowerCase();
}

function toBadgeClass(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "active") return "badge badge--active";
  if (normalized === "inactive") return "badge badge--inactive";
  if (normalized === "suspended") return "badge badge--suspended";
  return "badge";
}

function sanitize(value: string) {
  return value.trim();
}

function parseYear(value: string) {
  if (!value.trim()) return undefined;
  const year = Number(value);
  return Number.isNaN(year) ? undefined : year;
}

function parseNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function getMakeOptions(_currentMake: string) {
  return VEHICLE_MAKE_OPTIONS;
}

function toIso(value: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const usMatch = trimmed.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );
  if (usMatch) {
    const [, mm, dd, yyyy, hh = "0", min = "0"] = usMatch;
    const date = new Date(
      Number(yyyy),
      Number(mm) - 1,
      Number(dd),
      Number(hh),
      Number(min),
    );
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function parseIsoToMs(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? undefined : time;
}

function maxIso(...values: Array<string | undefined>) {
  let max: number | undefined;
  for (const value of values) {
    const time = parseIsoToMs(value);
    if (time === undefined) continue;
    if (max === undefined || time > max) {
      max = time;
    }
  }
  return max !== undefined ? new Date(max).toISOString() : undefined;
}

function formatDate(value?: string) {
  return formatAppDate(value, "—");
}

function normalizeAssignments(response: unknown) {
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];
  return items as Array<{
    assignmentId?: string;
    vin?: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    assignmentType?: string;
    tenantId?: string;
    driverId?: string;
  }>;
}

function normalizeVinHistory(response: unknown) {
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];
  return items as VinRegistryRecord[];
}

export function TenantVehicleAdminPage() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";

  const [search, setSearch] = useState("");
  const [selectedVin, setSelectedVin] = useState("");
  const [editForm, setEditForm] = useState({
    make: "",
    model: "",
    year: "",
    status: "ACTIVE",
    vehicleType: "",
    bodyType: "",
    fuelType: "",
    engineType: "",
    transmission: "",
    fuelTankCapacity: "",
    cityMileage: "",
    highwayMileage: "",
    frontTirePressure: "",
    rearTirePressure: "",
  });
  const [assignForm, setAssignForm] = useState({
    fleetId: "",
    effectiveFrom: "",
    reason: "Fleet assignment",
  });
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    vin: "",
    make: "",
    model: "",
    year: "",
    status: "ACTIVE",
    vehicleType: "",
    bodyType: "",
    fuelType: "",
    engineType: "",
    transmission: "",
    fuelTankCapacity: "",
    cityMileage: "",
    highwayMileage: "",
    frontTirePressure: "",
    rearTirePressure: "",
    fleetId: "",
    effectiveFrom: "",
    reason: "Tenant onboarding",
  });
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: vehicles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId ? queryKeys.vehicles(tenantId) : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId),
    enabled: Boolean(tenantId),
  });

  const { data: fleets = [] } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vehicles;
    return vehicles.filter((vehicle) =>
      [vehicle.vin, vehicle.make, vehicle.model, vehicle.fleetId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [vehicles, search]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.vin === selectedVin),
    [vehicles, selectedVin],
  );

  const {
    data: assignmentResponse,
    isLoading: assignmentsLoading,
    error: assignmentsError,
  } = useQuery({
    queryKey:
      tenantId && selectedVehicle?.vin
        ? ["vehicleAssignments", tenantId, selectedVehicle.vin]
        : ["vehicleAssignments", "none"],
    queryFn: async () => {
      try {
        return await fetchVehicleAssignments(selectedVehicle!.vin, tenantId, {
          roleOverride: resolvedRoleHeader,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (message.toLowerCase().includes("forbidden")) {
          return { items: [] };
        }
        throw err;
      }
    },
    enabled: Boolean(tenantId && selectedVehicle?.vin),
  });

  const assignments = useMemo(() => {
    const items = normalizeAssignments(assignmentResponse);
    return items.sort((a, b) =>
      String(b.effectiveFrom ?? "").localeCompare(
        String(a.effectiveFrom ?? ""),
      ),
    );
  }, [assignmentResponse]);

  const { data: vinHistoryResponse } = useQuery({
    queryKey:
      tenantId && selectedVehicle?.vin
        ? ["vinHistory", tenantId, selectedVehicle.vin]
        : ["vinHistory", "none"],
    queryFn: () =>
      fetchVinRegistryHistory(selectedVehicle!.vin, tenantId, {
        roleOverride: resolvedRoleHeader,
      }),
    enabled: Boolean(tenantId && selectedVehicle?.vin),
  });

  const currentVinAssignment = useMemo(() => {
    const history = normalizeVinHistory(vinHistoryResponse);
    if (!history.length) return undefined;
    const now = Date.now();
    const active = history.find((record) => {
      const from = parseIsoToMs(record.effectiveFrom);
      const to = parseIsoToMs(record.effectiveTo);
      if (from === undefined) return false;
      if (to === undefined) return from <= now;
      return from <= now && now <= to;
    });
    if (active) return active;
    return history
      .slice()
      .sort((a, b) =>
        String(b.effectiveFrom ?? "").localeCompare(
          String(a.effectiveFrom ?? ""),
        ),
      )[0];
  }, [vinHistoryResponse]);

  useEffect(() => {
    if (fleet?.id && !createForm.fleetId) {
      setCreateForm((prev) => ({ ...prev, fleetId: fleet.id }));
    }
  }, [createForm.fleetId, fleet?.id]);

  useEffect(() => {
    if (!selectedVehicle) {
      setEditForm({
        make: "",
        model: "",
        year: "",
        status: "ACTIVE",
        vehicleType: "",
        bodyType: "",
        fuelType: "",
        engineType: "",
        transmission: "",
        fuelTankCapacity: "",
        cityMileage: "",
        highwayMileage: "",
        frontTirePressure: "",
        rearTirePressure: "",
      });
      setAssignForm({
        fleetId: "",
        effectiveFrom: "",
        reason: "Fleet assignment",
      });
      setEditError(null);
      setEditStatus(null);
      return;
    }
    setEditForm({
      make: selectedVehicle.make ?? "",
      model: selectedVehicle.model ?? "",
      year: selectedVehicle.year ? String(selectedVehicle.year) : "",
      status: selectedVehicle.status ?? "ACTIVE",
      vehicleType: selectedVehicle.vehicleType ?? "",
      bodyType: selectedVehicle.bodyType ?? "",
      fuelType: selectedVehicle.fuelType ?? "",
      engineType: selectedVehicle.engineType ?? "",
      transmission: selectedVehicle.transmission ?? "",
      fuelTankCapacity:
        selectedVehicle.fuelTankCapacity !== undefined
          ? String(selectedVehicle.fuelTankCapacity)
          : "",
      cityMileage:
        selectedVehicle.cityMileage !== undefined
          ? String(selectedVehicle.cityMileage)
          : "",
      highwayMileage:
        selectedVehicle.highwayMileage !== undefined
          ? String(selectedVehicle.highwayMileage)
          : "",
      frontTirePressure:
        selectedVehicle.frontTirePressure !== undefined
          ? String(selectedVehicle.frontTirePressure)
          : "",
      rearTirePressure:
        selectedVehicle.rearTirePressure !== undefined
          ? String(selectedVehicle.rearTirePressure)
          : "",
    });
    setAssignForm({
      fleetId: selectedVehicle.fleetId ?? "",
      effectiveFrom: "",
      reason: "Fleet assignment",
    });
    setEditError(null);
    setEditStatus(null);
  }, [selectedVehicle]);

  const stats = useMemo(() => {
    const total = vehicles.length;
    const active = vehicles.filter(
      (vehicle) => normalizeStatus(vehicle.status) === "active",
    ).length;
    const inactive = vehicles.filter(
      (vehicle) => normalizeStatus(vehicle.status) === "inactive",
    ).length;
    const unassigned = vehicles.filter((vehicle) => !vehicle.fleetId).length;
    return { total, active, inactive, unassigned };
  }, [vehicles]);

  const roleHeader = useMemo(() => {
    if (roles.includes("platform_admin")) return "admin";
    if (roles.includes("tenant_admin")) return "tenant-admin";
    if (roles.includes("fleet_manager")) return "fleet-manager";
    if (roles.includes("dispatcher")) return "analyst";
    if (roles.includes("read_only")) return "read-only";
    return undefined;
  }, [roles]);

  const resolvedRoleHeader =
    roleHeader ?? (tenantId ? "tenant-admin" : undefined);

  const hasChanges = useMemo(() => {
    if (!selectedVehicle) return false;
    return (
      sanitize(editForm.make) !== sanitize(selectedVehicle.make ?? "") ||
      sanitize(editForm.model) !== sanitize(selectedVehicle.model ?? "") ||
      parseYear(editForm.year) !== selectedVehicle.year ||
      sanitize(editForm.status) !== sanitize(selectedVehicle.status ?? "") ||
      sanitize(editForm.vehicleType) !==
        sanitize(selectedVehicle.vehicleType ?? "") ||
      sanitize(editForm.bodyType) !==
        sanitize(selectedVehicle.bodyType ?? "") ||
      sanitize(editForm.fuelType) !==
        sanitize(selectedVehicle.fuelType ?? "") ||
      sanitize(editForm.engineType) !==
        sanitize(selectedVehicle.engineType ?? "") ||
      sanitize(editForm.transmission) !==
        sanitize(selectedVehicle.transmission ?? "") ||
      parseNumber(editForm.fuelTankCapacity) !==
        selectedVehicle.fuelTankCapacity ||
      parseNumber(editForm.cityMileage) !== selectedVehicle.cityMileage ||
      parseNumber(editForm.highwayMileage) !== selectedVehicle.highwayMileage ||
      parseNumber(editForm.frontTirePressure) !==
        selectedVehicle.frontTirePressure ||
      parseNumber(editForm.rearTirePressure) !==
        selectedVehicle.rearTirePressure
    );
  }, [editForm, selectedVehicle]);

  const handleUpdate = async () => {
    if (!tenantId || !selectedVehicle) return;
    setEditError(null);
    setEditStatus(null);
    try {
      await updateVehicle(
        selectedVehicle.vin,
        {
          make: sanitize(editForm.make) || undefined,
          model: sanitize(editForm.model) || undefined,
          year: parseYear(editForm.year),
          status: sanitize(editForm.status) || undefined,
          vehicleType: sanitize(editForm.vehicleType) || undefined,
          bodyType: sanitize(editForm.bodyType) || undefined,
          fuelType: sanitize(editForm.fuelType) || undefined,
          engineType: sanitize(editForm.engineType) || undefined,
          transmission: sanitize(editForm.transmission) || undefined,
          fuelTankCapacity: parseNumber(editForm.fuelTankCapacity),
          cityMileage: parseNumber(editForm.cityMileage),
          highwayMileage: parseNumber(editForm.highwayMileage),
          frontTirePressure: parseNumber(editForm.frontTirePressure),
          rearTirePressure: parseNumber(editForm.rearTirePressure),
        },
        { tenantId, roleOverride: resolvedRoleHeader },
      );
      setEditStatus("Vehicle updated.");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles(tenantId),
      });
      await queryClient.refetchQueries({
        queryKey: queryKeys.vehicles(tenantId),
      });
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Unable to update vehicle.",
      );
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !selectedVehicle) return;
    const confirmation = window.prompt(
      `Type ${selectedVehicle.vin} to permanently delete this vehicle.`,
    );
    if (confirmation !== selectedVehicle.vin) return;
    setEditError(null);
    setEditStatus(null);
    try {
      await deleteVehicle(selectedVehicle.vin, {
        tenantId,
        roleOverride: resolvedRoleHeader,
      });
      setSelectedVin("");
      setEditStatus("Vehicle permanently deleted.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles(tenantId),
      });
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Unable to delete vehicle.",
      );
    }
  };

  const handleAssignFleet = async () => {
    if (!tenantId || !selectedVehicle) return;
    if (!assignForm.fleetId) {
      setEditError("Select a fleet to assign.");
      return;
    }
    if (assignForm.fleetId === selectedVehicle.fleetId) {
      setEditStatus("Vehicle already assigned to this fleet.");
      return;
    }
    const effectiveFrom =
      toIso(assignForm.effectiveFrom) ?? new Date().toISOString();
    if (!sanitize(assignForm.reason)) {
      setEditError("Assignment reason is required.");
      return;
    }
    setEditError(null);
    setEditStatus(null);
    try {
      await assignVin(
        {
          vin: selectedVehicle.vin,
          tenantId,
          fleetId: assignForm.fleetId,
          effectiveFrom,
          reason: sanitize(assignForm.reason),
        },
        createIdempotencyKey(),
        { roleOverride: resolvedRoleHeader },
      );
      setEditStatus("Fleet assignment updated.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles(tenantId),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("overlaps existing record")) {
        try {
          const currentAssignment = currentVinAssignment;
          if (
            currentAssignment?.tenantId &&
            currentAssignment.tenantId !== tenantId
          ) {
            setEditError(
              "VIN belongs to another tenant at the selected effective date. Use a platform transfer or pick a later effective date.",
            );
            return;
          }
          const transferEffectiveFrom =
            maxIso(effectiveFrom, currentAssignment?.effectiveFrom) ??
            effectiveFrom;
          await transferVin(
            {
              vin: selectedVehicle.vin,
              fromTenantId: tenantId,
              toTenantId: tenantId,
              toFleetId: assignForm.fleetId,
              effectiveFrom: transferEffectiveFrom,
              reason: sanitize(assignForm.reason),
            },
            createIdempotencyKey(),
            { roleOverride: resolvedRoleHeader },
          );
          setEditStatus("Fleet assignment updated.");
          queryClient.invalidateQueries({
            queryKey: queryKeys.vehicles(tenantId),
          });
          return;
        } catch (transferErr) {
          setEditError(
            transferErr instanceof Error
              ? transferErr.message
              : "Unable to assign fleet.",
          );
          return;
        }
      }
      setEditError(message || "Unable to assign fleet.");
    }
  };

  const handleCreate = async () => {
    const vinValue = sanitize(createForm.vin);
    if (!tenantId || !vinValue) {
      setCreateError("VIN is required.");
      return;
    }
    const reasonValue = sanitize(createForm.reason);
    if (!reasonValue) {
      setCreateError("Assignment reason is required.");
      return;
    }
    setCreateError(null);
    setCreateStatus(null);

    const effectiveFrom =
      toIso(createForm.effectiveFrom) ?? new Date().toISOString();
    const fleetIdValue = sanitize(createForm.fleetId) || undefined;

    try {
      let alreadyExists = false;
      let assignmentSkipped = false;
      try {
        await assignVin(
          {
            vin: vinValue,
            tenantId,
            fleetId: fleetIdValue,
            effectiveFrom,
            reason: reasonValue,
          },
          createIdempotencyKey(),
          { roleOverride: resolvedRoleHeader },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        const normalized = message.toLowerCase();
        if (normalized.includes("overlaps existing record")) {
          if (!fleetIdValue) {
            assignmentSkipped = true;
            return;
          }
          let transferEffectiveFrom = effectiveFrom;
          try {
            const historyResponse = await fetchVinRegistryHistory(
              vinValue,
              tenantId,
              { roleOverride: resolvedRoleHeader },
            );
            const history = normalizeVinHistory(historyResponse);
            const now = Date.now();
            const active = history.find((record) => {
              const from = parseIsoToMs(record.effectiveFrom);
              const to = parseIsoToMs(record.effectiveTo);
              if (from === undefined) return false;
              if (to === undefined) return from <= now;
              return from <= now && now <= to;
            });
            const latest =
              active ??
              history
                .slice()
                .sort((a, b) =>
                  String(b.effectiveFrom ?? "").localeCompare(
                    String(a.effectiveFrom ?? ""),
                  ),
                )[0];
            const ownerTenant = active?.tenantId ?? latest?.tenantId;
            if (ownerTenant && ownerTenant !== tenantId) {
              setCreateError(
                "VIN belongs to another tenant at the selected effective date. Use a platform transfer or pick a later effective date.",
              );
              return;
            }
            transferEffectiveFrom =
              maxIso(effectiveFrom, latest?.effectiveFrom) ?? effectiveFrom;
          } catch (historyErr) {
            const historyMessage =
              historyErr instanceof Error ? historyErr.message : "";
            if (!historyMessage.toLowerCase().includes("forbidden")) {
              throw historyErr;
            }
            setCreateError(
              "VIN belongs to another tenant at the selected effective date. Use a platform transfer or pick a later effective date.",
            );
            return;
          }
          await transferVin(
            {
              vin: vinValue,
              fromTenantId: tenantId,
              toTenantId: tenantId,
              toFleetId: fleetIdValue,
              effectiveFrom: transferEffectiveFrom,
              reason: reasonValue,
            },
            createIdempotencyKey(),
            { roleOverride: resolvedRoleHeader },
          );
        } else if (normalized.includes("already exists")) {
          alreadyExists = true;
        } else {
          throw err;
        }
      }

      try {
        await createVehicle(
          {
            vin: vinValue,
            make: sanitize(createForm.make) || undefined,
            model: sanitize(createForm.model) || undefined,
            year: parseYear(createForm.year),
            status: sanitize(createForm.status) || undefined,
            vehicleType: sanitize(createForm.vehicleType) || undefined,
            bodyType: sanitize(createForm.bodyType) || undefined,
            fuelType: sanitize(createForm.fuelType) || undefined,
            engineType: sanitize(createForm.engineType) || undefined,
            transmission: sanitize(createForm.transmission) || undefined,
            fuelTankCapacity: parseNumber(createForm.fuelTankCapacity),
            cityMileage: parseNumber(createForm.cityMileage),
            highwayMileage: parseNumber(createForm.highwayMileage),
            frontTirePressure: parseNumber(createForm.frontTirePressure),
            rearTirePressure: parseNumber(createForm.rearTirePressure),
            reason: "Tenant admin create",
          },
          { tenantId, roleOverride: resolvedRoleHeader },
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (!message.toLowerCase().includes("already exists")) {
          throw err;
        }
        alreadyExists = true;
      }

      if (assignmentSkipped) {
        setCreateStatus("Vehicle added; assignment already exists.");
      } else {
        setCreateStatus(
          alreadyExists
            ? "Vehicle already exists; assignment updated."
            : "Vehicle added.",
        );
      }
      setCreateForm({
        vin: "",
        make: "",
        model: "",
        year: "",
        status: "ACTIVE",
        vehicleType: "",
        bodyType: "",
        fuelType: "",
        engineType: "",
        transmission: "",
        fuelTankCapacity: "",
        cityMileage: "",
        highwayMileage: "",
        frontTirePressure: "",
        rearTirePressure: "",
        fleetId: "",
        effectiveFrom: "",
        reason: "Tenant onboarding",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles(tenantId),
      });
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Unable to create vehicle.",
      );
    }
  };

  return (
    <div className="page tenant-admin-page">
      <section className="tenant-admin-hero">
        <div className="tenant-admin-hero__glow" />
        <div>
          <p className="tenant-admin-hero__eyebrow">Vehicle admin</p>
          <h1>Manage Vehicles</h1>
          <p className="tenant-admin-hero__subtitle">
            Maintain VIN inventory, assign fleets, and keep vehicle details
            accurate for this tenant.
          </p>
        </div>
        <div className="tenant-admin-stats">
          <div className="tenant-admin-stat">
            <span>Total vehicles</span>
            <strong>{stats.total}</strong>
            <span className="text-muted">Inventory size</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Active</span>
            <strong>{stats.active}</strong>
            <span className="text-muted">Reporting assets</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
            <span className="text-muted">Paused or idle</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Unassigned</span>
            <strong>{stats.unassigned}</strong>
            <span className="text-muted">Need fleet mapping</span>
          </div>
        </div>
      </section>

      <div className="split-layout">
        <Card title="Vehicles">
          <div className="stack">
            <label className="form__field">
              <span className="text-muted">Search</span>
              <input
                className="input"
                placeholder="Search VIN, make, model"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {!tenantId ? (
              <p>Select a tenant to view vehicles.</p>
            ) : isLoading ? (
              <p>Loading vehicles...</p>
            ) : error ? (
              <p>Unable to load vehicles.</p>
            ) : filteredVehicles.length === 0 ? (
              <p>No vehicles found for this tenant.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>VIN</th>
                      <th>Fleet</th>
                      <th>Status</th>
                      <th>Vehicle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => (
                      <tr
                        key={vehicle.vin}
                        className={
                          vehicle.vin === selectedVin
                            ? "is-selected"
                            : undefined
                        }
                        onClick={() => setSelectedVin(vehicle.vin)}
                      >
                        <td className="mono">{vehicle.vin}</td>
                        <td>{vehicle.fleetId ?? "Unassigned"}</td>
                        <td>
                          <span className={toBadgeClass(vehicle.status)}>
                            {vehicle.status ?? "Unknown"}
                          </span>
                        </td>
                        <td>
                          {[vehicle.year, vehicle.make, vehicle.model]
                            .filter(Boolean)
                            .join(" ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card title="Vehicle Details">
          {!selectedVehicle ? (
            <div className="empty-state">
              <div className="empty-state__icon">Vehicles</div>
              <h3>Select a vehicle</h3>
              <p className="text-muted">
                Choose a VIN to manage vehicle details and assignments.
              </p>
            </div>
          ) : (
            <div className="stack">
              <div className="detail-grid">
                <div>
                  <div className="text-muted">VIN</div>
                  <div className="mono">{selectedVehicle.vin}</div>
                </div>
                <div>
                  <div className="text-muted">Status</div>
                  <span className={toBadgeClass(selectedVehicle.status)}>
                    {selectedVehicle.status ?? "Unknown"}
                  </span>
                </div>
                <div>
                  <div className="text-muted">Fleet</div>
                  <div>{selectedVehicle.fleetId ?? "Unassigned"}</div>
                </div>
              </div>

              {editStatus ? (
                <div className="form-success">{editStatus}</div>
              ) : null}
              {editError ? <div className="form-error">{editError}</div> : null}

              <div className="form-grid">
                <label className="form__field">
                  <span className="text-muted">Make</span>
                  <select
                    className="select"
                    value={editForm.make}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        make: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {getMakeOptions(editForm.make).map((makeOption) => (
                      <option key={makeOption} value={makeOption}>
                        {makeOption}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Model</span>
                  <input
                    className="input"
                    value={editForm.model}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        model: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Year</span>
                  <input
                    className="input"
                    value={editForm.year}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        year: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Status</span>
                  <select
                    className="select"
                    value={editForm.status}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Vehicle type</span>
                  <select
                    className="select"
                    value={editForm.vehicleType}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        vehicleType: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {VEHICLE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Body type</span>
                  <select
                    className="select"
                    value={editForm.bodyType}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        bodyType: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {BODY_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Fuel type</span>
                  <select
                    className="select"
                    value={editForm.fuelType}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        fuelType: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {FUEL_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Engine type</span>
                  <select
                    className="select"
                    value={editForm.engineType}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        engineType: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {ENGINE_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Transmission</span>
                  <select
                    className="select"
                    value={editForm.transmission}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        transmission: event.target.value,
                      }))
                    }
                  >
                    <option value="">Select</option>
                    {TRANSMISSION_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Fuel tank capacity</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.fuelTankCapacity}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        fuelTankCapacity: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">City mileage</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.cityMileage}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        cityMileage: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Highway mileage</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.highwayMileage}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        highwayMileage: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Front tire pressure</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.frontTirePressure}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        frontTirePressure: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Rear tire pressure</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="any"
                    value={editForm.rearTirePressure}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        rearTirePressure: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="inline">
                <button
                  className="btn btn--secondary"
                  onClick={handleUpdate}
                  disabled={!hasChanges}
                >
                  Save changes
                </button>
                <button className="btn btn--danger" onClick={handleDelete}>
                  Delete permanently
                </button>
              </div>

              <div className="form-grid">
                <label className="form__field">
                  <span className="text-muted">
                    Assign fleet <span className="required">*</span>
                  </span>
                  <select
                    className="select"
                    value={assignForm.fleetId}
                    onChange={(event) =>
                      setAssignForm((prev) => ({
                        ...prev,
                        fleetId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose fleet</option>
                    {fleets.map((fleet) => (
                      <option key={fleet.fleetId} value={fleet.fleetId}>
                        {fleet.name ?? fleet.fleetId}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span className="text-muted">Effective from</span>
                  <input
                    className="input"
                    type="date"
                    placeholder="mm/dd/yyyy"
                    value={assignForm.effectiveFrom}
                    onChange={(event) =>
                      setAssignForm((prev) => ({
                        ...prev,
                        effectiveFrom: event.target.value,
                      }))
                    }
                  />
                  <span className="text-muted">
                    Current effective from:{" "}
                    {formatDate(currentVinAssignment?.effectiveFrom)}
                  </span>
                </label>
                <label className="form__field">
                  <span className="text-muted">
                    Reason <span className="required">*</span>
                  </span>
                  <input
                    className="input"
                    value={assignForm.reason}
                    onChange={(event) =>
                      setAssignForm((prev) => ({
                        ...prev,
                        reason: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="inline">
                <button
                  className="btn"
                  onClick={handleAssignFleet}
                  disabled={!assignForm.fleetId}
                >
                  Assign fleet
                </button>
              </div>
              <div className="divider" />
              <div>
                <h4>Current assignments</h4>
                {!selectedVehicle ? null : assignmentsLoading ? (
                  <p>Loading assignments...</p>
                ) : assignmentsError ? (
                  <p>Unable to load assignments.</p>
                ) : assignments.length === 0 ? (
                  <p className="text-muted">No driver assignments found.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Driver</th>
                          <th>Effective from</th>
                          <th>Effective to</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assignment) => (
                          <tr
                            key={
                              assignment.assignmentId ??
                              `${assignment.driverId ?? "driver"}-${
                                assignment.effectiveFrom ?? ""
                              }
                            `
                            }
                          >
                            <td>{assignment.driverId ?? "—"}</td>
                            <td>{assignment.effectiveFrom ?? "—"}</td>
                            <td>{assignment.effectiveTo ?? "—"}</td>
                            <td>{assignment.assignmentType ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <span className="text-muted">
                Deleting permanently removes the vehicle record. Historical VIN
                assignments remain for audit.
              </span>
            </div>
          )}
        </Card>
      </div>

      <Card title="Add Vehicle">
        {createStatus ? (
          <div className="form-success">{createStatus}</div>
        ) : null}
        {createError ? <div className="form-error">{createError}</div> : null}
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">
              VIN <span className="required">*</span>
            </span>
            <input
              className="input"
              value={createForm.vin}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  vin: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Make</span>
            <select
              className="select"
              value={createForm.make}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  make: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              {VEHICLE_MAKE_OPTIONS.map((makeOption) => (
                <option key={makeOption} value={makeOption}>
                  {makeOption}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Model</span>
            <input
              className="input"
              value={createForm.model}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  model: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Year</span>
            <input
              className="input"
              value={createForm.year}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  year: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Status</span>
            <select
              className="select"
              value={createForm.status}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Vehicle type</span>
            <select
              className="select"
              value={createForm.vehicleType}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  vehicleType: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              {VEHICLE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Body type</span>
            <select
              className="select"
              value={createForm.bodyType}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  bodyType: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              {BODY_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Fuel type</span>
            <select
              className="select"
              value={createForm.fuelType}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  fuelType: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              {FUEL_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Engine type</span>
            <select
              className="select"
              value={createForm.engineType}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  engineType: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              {ENGINE_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Transmission</span>
            <select
              className="select"
              value={createForm.transmission}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  transmission: event.target.value,
                }))
              }
            >
              <option value="">Select</option>
              {TRANSMISSION_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Fuel tank capacity</span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={createForm.fuelTankCapacity}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  fuelTankCapacity: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">City mileage</span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={createForm.cityMileage}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  cityMileage: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Highway mileage</span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={createForm.highwayMileage}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  highwayMileage: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Front tire pressure</span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={createForm.frontTirePressure}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  frontTirePressure: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Rear tire pressure</span>
            <input
              className="input"
              type="number"
              min="0"
              step="any"
              value={createForm.rearTirePressure}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  rearTirePressure: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Fleet</span>
            <select
              className="select"
              value={createForm.fleetId}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  fleetId: event.target.value,
                }))
              }
            >
              <option value="">Unassigned</option>
              {fleets.map((fleet) => (
                <option key={fleet.fleetId} value={fleet.fleetId}>
                  {fleet.name ?? fleet.fleetId}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Effective from</span>
            <input
              className="input"
              type="date"
              placeholder="mm/dd/yyyy"
              value={createForm.effectiveFrom}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  effectiveFrom: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field form__field--full">
            <span className="text-muted">
              Assignment reason <span className="required">*</span>
            </span>
            <input
              className="input"
              value={createForm.reason}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  reason: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="form__actions">
          <button className="btn" onClick={handleCreate}>
            Add vehicle
          </button>
        </div>
      </Card>
    </div>
  );
}
