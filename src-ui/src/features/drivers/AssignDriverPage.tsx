import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createDriverAssignment,
  deleteDriverAssignment,
  fetchDriverAssignments,
  fetchDrivers,
  fetchVehicleAssignments,
  fetchVehicles,
  updateDriverAssignment,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../context/AuthContext";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { createIdempotencyKey } from "../../utils/id";

type AssignmentRecord = {
  assignmentId?: string;
  vin?: string;
  driverId?: string;
  tenantId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  assignmentType?: string;
};

function normalizeAssignments(response: unknown) {
  const items = Array.isArray(response)
    ? response
    : typeof response === "object" &&
        response !== null &&
        Array.isArray((response as { items?: unknown[] }).items)
      ? (response as { items: unknown[] }).items
      : [];
  return items as AssignmentRecord[];
}

function parseIsoToMs(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? undefined : time;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatDateTimeLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateOnly(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addSeconds(value: string, seconds: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setSeconds(date.getSeconds() + seconds);
  return date.toISOString();
}

export function AssignDriverPage() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const [searchParams] = useSearchParams();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id;
  const presetDriverId = searchParams.get("driverId") ?? "";

  const [driverId, setDriverId] = useState(presetDriverId);
  const [vin, setVin] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [assignmentType, setAssignmentType] = useState("PRIMARY");
  const [reason, setReason] = useState("Shift assignment");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<AssignmentRecord | null>(null);

  const canDeleteAssignment = useMemo(
    () =>
      roles.includes("platform_admin") ||
      roles.includes("tenant_admin") ||
      roles.includes("fleet_manager"),
    [roles],
  );

  const canEditAssignment = canDeleteAssignment;

  const roleHeader = useMemo(() => {
    if (roles.includes("platform_admin")) return "admin";
    if (roles.includes("tenant_admin")) return "tenant-admin";
    if (roles.includes("fleet_manager")) return "fleet-manager";
    if (roles.includes("dispatcher")) return "analyst";
    if (roles.includes("read_only")) return "read-only";
    return undefined;
  }, [roles]);

  const { data: drivers = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId, fleetId),
    enabled: Boolean(tenantId),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId),
    enabled: Boolean(tenantId),
  });

  const { data: driverAssignmentsResponse } = useQuery({
    queryKey:
      tenantId && driverId
        ? ["driverAssignments", tenantId, driverId]
        : ["driverAssignments", "none"],
    queryFn: () => fetchDriverAssignments(tenantId, driverId),
    enabled: Boolean(tenantId && driverId),
  });

  const { data: vehicleAssignmentsResponse } = useQuery({
    queryKey:
      tenantId && vin
        ? ["vehicleAssignments", tenantId, vin]
        : ["vehicleAssignments", "none"],
    queryFn: () => fetchVehicleAssignments(vin, tenantId),
    enabled: Boolean(tenantId && vin),
  });

  const vehicleOptions = useMemo(
    () => vehicles.map((vehicle) => vehicle.vin),
    [vehicles],
  );

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.driverId === driverId),
    [drivers, driverId],
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.vin === vin),
    [vehicles, vin],
  );

  const driverAssignments = useMemo(() => {
    const items = normalizeAssignments(driverAssignmentsResponse);
    return items.sort((a, b) =>
      String(b.effectiveFrom ?? "").localeCompare(
        String(a.effectiveFrom ?? ""),
      ),
    );
  }, [driverAssignmentsResponse]);

  const vehicleAssignments = useMemo(() => {
    const items = normalizeAssignments(vehicleAssignmentsResponse);
    return items.sort((a, b) =>
      String(b.effectiveFrom ?? "").localeCompare(
        String(a.effectiveFrom ?? ""),
      ),
    );
  }, [vehicleAssignmentsResponse]);

  const openDriverAssignments = useMemo(
    () =>
      driverAssignments.filter((assignment) => !assignment.effectiveTo).length,
    [driverAssignments],
  );

  const openVehicleAssignments = useMemo(
    () =>
      vehicleAssignments.filter((assignment) => !assignment.effectiveTo).length,
    [vehicleAssignments],
  );

  const overlapHint = useMemo(() => {
    if (!driverAssignments.length) return undefined;
    const openEnded = driverAssignments.find(
      (assignment) => !assignment.effectiveTo,
    );
    if (openEnded) {
      return {
        message:
          "Driver has an open-ended assignment. End it before creating a new one.",
        nextStart: undefined,
      };
    }
    const latestEnd = driverAssignments
      .map((assignment) => assignment.effectiveTo)
      .filter(Boolean)
      .map((value) => ({ value: value as string, time: parseIsoToMs(value) }))
      .filter((entry) => entry.time !== undefined)
      .sort((a, b) => (b.time ?? 0) - (a.time ?? 0))[0];
    if (!latestEnd) return undefined;
    const nextStart = addSeconds(latestEnd.value, 1);
    return {
      message: "Next available start after current assignments.",
      nextStart,
    };
  }, [driverAssignments]);

  const handleSubmit = async () => {
    if (!tenantId) {
      setError("Select a tenant to continue.");
      return;
    }
    if (!driverId) {
      setError("Select a driver.");
      return;
    }
    if (!vin) {
      setError("Select a VIN.");
      return;
    }
    if (!effectiveFrom) {
      setError("Effective start is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      if (editingAssignment) {
        if (
          !editingAssignment.driverId ||
          !editingAssignment.vin ||
          !editingAssignment.effectiveFrom
        ) {
          throw new Error("Missing original assignment details.");
        }
        const assignmentTenantId = editingAssignment.tenantId ?? tenantId;
        if (!assignmentTenantId) {
          throw new Error("Select a tenant to continue.");
        }
        const newFromIso = new Date(effectiveFrom).toISOString();
        const originalFromMs = parseIsoToMs(editingAssignment.effectiveFrom);
        const newFromMs = parseIsoToMs(newFromIso);
        const newEffectiveFrom =
          originalFromMs !== undefined && newFromMs !== undefined
            ? originalFromMs !== newFromMs
              ? newFromIso
              : undefined
            : newFromIso !== editingAssignment.effectiveFrom
              ? newFromIso
              : undefined;
        await updateDriverAssignment(
          assignmentTenantId,
          editingAssignment.driverId,
          {
            vin: editingAssignment.vin,
            effectiveFrom: editingAssignment.effectiveFrom,
            newEffectiveFrom,
            effectiveTo: effectiveTo
              ? new Date(effectiveTo).toISOString()
              : undefined,
            assignmentType,
            reason,
          },
          createIdempotencyKey(),
          { roleOverride: roleHeader, fleetId },
        );
        setStatus("Assignment updated.");
        setEditingAssignment(null);
        queryClient.invalidateQueries({
          queryKey: ["driverAssignments", assignmentTenantId, driverId],
        });
        queryClient.invalidateQueries({
          queryKey: ["vehicleAssignments", assignmentTenantId, vin],
        });
        return;
      }
      await createDriverAssignment(
        driverId,
        {
          tenantId,
          vin,
          effectiveFrom: new Date(effectiveFrom).toISOString(),
          effectiveTo: effectiveTo
            ? new Date(effectiveTo).toISOString()
            : undefined,
          assignmentType,
          reason,
        },
        createIdempotencyKey(),
        { roleOverride: roleHeader, fleetId },
      );
      setStatus("Assignment created.");
      queryClient.invalidateQueries({
        queryKey: ["driverAssignments", tenantId, driverId],
      });
      queryClient.invalidateQueries({
        queryKey: ["vehicleAssignments", tenantId, vin],
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to assign driver.";
      if (
        message.toLowerCase().includes("overlaps existing record") &&
        overlapHint?.nextStart
      ) {
        const nextValue = formatDateTimeLocal(overlapHint.nextStart);
        setError(
          `Overlaps existing assignment. Next available start: ${formatDateTime(overlapHint.nextStart)}.`,
        );
        if (nextValue) {
          setEffectiveFrom(formatDateOnly(overlapHint.nextStart));
        }
        return;
      }
      if (
        message.toLowerCase().includes("overlaps existing record") &&
        overlapHint?.message
      ) {
        setError(`Overlaps existing assignment. ${overlapHint.message}`);
        return;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAssignment = (assignment: AssignmentRecord) => {
    if (!canEditAssignment) return;
    setEditingAssignment(assignment);
    setDriverId(assignment.driverId ?? "");
    setVin(assignment.vin ?? "");
    setEffectiveFrom(
      assignment.effectiveFrom ? formatDateOnly(assignment.effectiveFrom) : "",
    );
    setEffectiveTo(
      assignment.effectiveTo ? formatDateOnly(assignment.effectiveTo) : "",
    );
    setAssignmentType(assignment.assignmentType ?? "PRIMARY");
    setReason("Assignment update");
    setStatus(null);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingAssignment(null);
    setStatus(null);
    setError(null);
  };

  const handleDeleteAssignment = async (assignment: AssignmentRecord) => {
    if (
      !(assignment.tenantId ?? tenantId) ||
      !assignment.driverId ||
      !assignment.vin ||
      !assignment.effectiveFrom
    ) {
      return;
    }
    const assignmentTenantId = assignment.tenantId ?? tenantId;
    const confirmation = window.prompt(
      `Type ${assignment.vin} to delete this assignment starting ${formatDateTime(assignment.effectiveFrom)}.`,
    );
    if (confirmation !== assignment.vin) return;
    setError(null);
    setStatus(null);
    try {
      await deleteDriverAssignment(
        assignmentTenantId,
        assignment.driverId,
        assignment.vin,
        assignment.effectiveFrom,
        { roleOverride: roleHeader, fleetId },
      );
      setStatus("Assignment deleted.");
      queryClient.invalidateQueries({
        queryKey: [
          "driverAssignments",
          assignmentTenantId,
          assignment.driverId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["vehicleAssignments", assignmentTenantId, assignment.vin],
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete assignment.",
      );
    }
  };

  return (
    <div className="page">
      <section className="assignment-hero">
        <div className="assignment-hero__glow" />
        <div className="assignment-hero__content">
          <div>
            <p className="assignment-hero__eyebrow">Driver operations</p>
            <h1>Assign Driver</h1>
            <p className="assignment-hero__subtitle">
              Attach drivers to vehicles with clear effective dates and fast
              conflict checks.
            </p>
          </div>
          <div className="assignment-hero__meta">
            <div className="assignment-chip">
              Driver:{" "}
              {(selectedDriver?.name ??
                selectedDriver?.displayName ??
                driverId) ||
                "Not selected"}
            </div>
            <div className="assignment-chip">
              Vehicle: {(selectedVehicle?.vin ?? vin) || "Not selected"}
            </div>
            <div className="assignment-chip">
              Open driver assignments: {openDriverAssignments}
            </div>
            <div className="assignment-chip">
              Open vehicle assignments: {openVehicleAssignments}
            </div>
          </div>
        </div>
      </section>

      <div className="assignment-layout">
        <div className="assignment-main">
          <Card title="Assignment details">
            {status ? <div className="form-success">{status}</div> : null}
            {error ? <div className="form-error">{error}</div> : null}
            {editingAssignment ? (
              <div className="form-hint">
                Editing dates only. Driver and VIN cannot be changed.
              </div>
            ) : null}
            <div className="form-grid">
              <label className="form__field">
                <span className="text-muted">Driver</span>
                <select
                  className="select"
                  value={driverId}
                  onChange={(event) => setDriverId(event.target.value)}
                  disabled={Boolean(editingAssignment)}
                >
                  <option value="">Choose driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.driverId} value={driver.driverId}>
                      {driver.name ?? driver.displayName ?? driver.driverId}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form__field">
                <span className="text-muted">VIN</span>
                <select
                  className="select"
                  value={vin}
                  onChange={(event) => setVin(event.target.value)}
                  disabled={Boolean(editingAssignment)}
                >
                  <option value="">Choose vehicle</option>
                  {vehicleOptions.map((vehicleVin) => (
                    <option key={vehicleVin} value={vehicleVin}>
                      {vehicleVin}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form__field">
                <span className="text-muted">Effective from</span>
                <input
                  className="input"
                  type="date"
                  value={effectiveFrom}
                  onChange={(event) => setEffectiveFrom(event.target.value)}
                />
                {overlapHint?.nextStart ? (
                  <span className="text-muted">
                    Next available start:{" "}
                    {formatDateTime(overlapHint.nextStart)}
                  </span>
                ) : null}
                {overlapHint?.message && !overlapHint.nextStart ? (
                  <span className="text-muted">{overlapHint.message}</span>
                ) : null}
              </label>
              <label className="form__field">
                <span className="text-muted">Effective to</span>
                <input
                  className="input"
                  type="date"
                  value={effectiveTo}
                  onChange={(event) => setEffectiveTo(event.target.value)}
                />
              </label>
              <label className="form__field">
                <span className="text-muted">Assignment type</span>
                <select
                  className="select"
                  value={assignmentType}
                  onChange={(event) => setAssignmentType(event.target.value)}
                >
                  <option value="PRIMARY">PRIMARY</option>
                  <option value="SECONDARY">SECONDARY</option>
                  <option value="TEMPORARY">TEMPORARY</option>
                </select>
              </label>
              <label className="form__field form__field--full">
                <span className="text-muted">Reason</span>
                <input
                  className="input"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </label>
            </div>
            <div className="form__actions">
              {editingAssignment ? (
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel edit
                </button>
              ) : null}
              <button
                className="btn"
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingAssignment
                    ? "Update assignment"
                    : "Assign driver"}
              </button>
            </div>
          </Card>
          <Card title="Assignment timeline">
            {!driverId && !vin ? (
              <div className="empty-state">
                Timeline data will appear after a driver and VIN are selected.
              </div>
            ) : (
              <div className="stack">
                <div>
                  <h4>Driver assignments</h4>
                  {driverAssignments.length === 0 ? (
                    <p className="text-muted">
                      No assignments found for this driver.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>VIN</th>
                            <th>Effective from</th>
                            <th>Effective to</th>
                            <th>Type</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driverAssignments.map((assignment) => (
                            <tr
                              key={`${assignment.assignmentId ?? assignment.vin}-${assignment.effectiveFrom ?? ""}`}
                            >
                              <td>{assignment.vin ?? "—"}</td>
                              <td>
                                {formatDateTime(assignment.effectiveFrom)}
                              </td>
                              <td>{formatDateTime(assignment.effectiveTo)}</td>
                              <td>{assignment.assignmentType ?? "—"}</td>
                              <td>
                                {canEditAssignment ? (
                                  <button
                                    className="btn btn--ghost btn--action"
                                    type="button"
                                    onClick={() =>
                                      handleEditAssignment(assignment)
                                    }
                                  >
                                    Edit
                                  </button>
                                ) : null}
                                {canDeleteAssignment ? (
                                  <button
                                    className="btn btn--danger-ghost btn--action"
                                    type="button"
                                    onClick={() =>
                                      handleDeleteAssignment(assignment)
                                    }
                                  >
                                    Delete
                                  </button>
                                ) : canEditAssignment ? null : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div>
                  <h4>Vehicle assignments</h4>
                  {vehicleAssignments.length === 0 ? (
                    <p className="text-muted">
                      No assignments found for this vehicle.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Driver</th>
                            <th>Effective from</th>
                            <th>Effective to</th>
                            <th>Type</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicleAssignments.map((assignment) => (
                            <tr
                              key={`${assignment.assignmentId ?? assignment.driverId}-${assignment.effectiveFrom ?? ""}`}
                            >
                              <td>{assignment.driverId ?? "—"}</td>
                              <td>
                                {formatDateTime(assignment.effectiveFrom)}
                              </td>
                              <td>{formatDateTime(assignment.effectiveTo)}</td>
                              <td>{assignment.assignmentType ?? "—"}</td>
                              <td>
                                {canEditAssignment ? (
                                  <button
                                    className="btn btn--ghost btn--action"
                                    type="button"
                                    onClick={() =>
                                      handleEditAssignment(assignment)
                                    }
                                  >
                                    Edit
                                  </button>
                                ) : null}
                                {canDeleteAssignment ? (
                                  <button
                                    className="btn btn--danger-ghost btn--action"
                                    type="button"
                                    onClick={() =>
                                      handleDeleteAssignment(assignment)
                                    }
                                  >
                                    Delete
                                  </button>
                                ) : canEditAssignment ? null : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
        <div className="assignment-side">
          <Card title="Assignment guidance">
            <div className="assignment-help">
              <div className="assignment-help__item">
                <strong className="assignment-help__title">
                  Overlap checks
                </strong>
                <p className="assignment-help__text">
                  Assignments cannot overlap for the same driver. End open-ended
                  records first or pick the next available start time.
                </p>
              </div>
              <div className="assignment-help__item">
                <strong className="assignment-help__title">
                  Next available
                </strong>
                <p className="assignment-help__text">
                  {overlapHint?.nextStart
                    ? formatDateTime(overlapHint.nextStart)
                    : "Select a driver to compute the next available start."}
                </p>
              </div>
              <div className="assignment-help__item">
                <strong className="assignment-help__title">Fix mistakes</strong>
                <p className="assignment-help__text">
                  Platform Admin, Tenant Admin, and Fleet Manager can delete a
                  wrong assignment from the timeline tables.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
