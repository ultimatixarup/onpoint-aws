import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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

type TimelineScale = "week" | "month" | "quarter";

type TimelineStatus = "active" | "upcoming" | "ended";

type TimelineBar = {
  key: string;
  label: string;
  sublabel: string;
  leftPercent: number;
  widthPercent: number;
  startLabel: string;
  endLabel: string;
  status: TimelineStatus;
  hasConflict: boolean;
};

type TableAssignmentRow = {
  key: string;
  assignment: AssignmentRecord;
  driverId: string;
  vin: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  assignmentType?: string;
  source: "Driver" | "Vehicle" | "Both" | "All";
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
  const [timelineView, setTimelineView] = useState<"timeline" | "table">(
    "table",
  );
  const [timelineScale, setTimelineScale] = useState<TimelineScale>("month");
  const [tableDriverFilter, setTableDriverFilter] = useState("");
  const [tableVinFilter, setTableVinFilter] = useState("");
  const [tableDateFrom, setTableDateFrom] = useState("");
  const [tableDateTo, setTableDateTo] = useState("");

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

  const { data: allTenantDrivers = [] } = useQuery({
    queryKey: tenantId ? queryKeys.drivers(tenantId) : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId),
    enabled: Boolean(tenantId && fleetId),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId),
    enabled: Boolean(tenantId),
  });

  const { data: allTenantVehicles = [] } = useQuery({
    queryKey: tenantId ? queryKeys.vehicles(tenantId) : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId),
    enabled: Boolean(tenantId && fleetId),
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

  const driverOptions = useMemo(
    () =>
      drivers.length > 0 || !fleetId
        ? drivers
        : allTenantDrivers,
    [allTenantDrivers, drivers, fleetId],
  );

  const vehicleOptions = useMemo(
    () =>
      (vehicles.length > 0 || !fleetId ? vehicles : allTenantVehicles)
        .map((vehicle) => vehicle.vin)
        .filter(Boolean),
    [allTenantVehicles, fleetId, vehicles],
  );

  const { data: allAssignmentsResponse = [] } = useQuery({
    queryKey: ["allVehicleAssignments", tenantId, fleetId ?? "all", ...vehicleOptions],
    queryFn: async () => {
      const responses = await Promise.all(
        vehicleOptions.map((vehicleVin) =>
          fetchVehicleAssignments(vehicleVin, tenantId).catch(() => ({ items: [] })),
        ),
      );
      return responses;
    },
    enabled: Boolean(tenantId && vehicleOptions.length > 0),
  });

  const selectedDriver = useMemo(
    () => driverOptions.find((driver) => driver.driverId === driverId),
    [driverOptions, driverId],
  );

  const selectedVehicle = useMemo(
    () =>
      (vehicles.length > 0 || !fleetId ? vehicles : allTenantVehicles).find(
        (vehicle) => vehicle.vin === vin,
      ),
    [allTenantVehicles, fleetId, vehicles, vin],
  );

  useEffect(() => {
    if (!driverId && driverOptions.length === 1) {
      setDriverId(driverOptions[0].driverId);
    }
  }, [driverId, driverOptions]);

  useEffect(() => {
    if (!vin && vehicleOptions.length === 1) {
      setVin(vehicleOptions[0]);
    }
  }, [vehicleOptions, vin]);

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

  const allAssignments = useMemo(() => {
    return allAssignmentsResponse
      .flatMap((response) => normalizeAssignments(response))
      .sort((a, b) =>
        String(b.effectiveFrom ?? "").localeCompare(
          String(a.effectiveFrom ?? ""),
        ),
      );
  }, [allAssignmentsResponse]);

  const timelineDriverAssignments = useMemo(
    () => (driverId ? driverAssignments : allAssignments),
    [allAssignments, driverAssignments, driverId],
  );

  const timelineVehicleAssignments = useMemo(
    () => (vin ? vehicleAssignments : allAssignments),
    [allAssignments, vehicleAssignments, vin],
  );

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

  const timelineWindow = useMemo(
    () =>
      buildTimelineWindow(
        timelineScale,
        timelineDriverAssignments,
        timelineVehicleAssignments,
      ),
    [timelineDriverAssignments, timelineScale, timelineVehicleAssignments],
  );

  const driverTimelineBars = useMemo(
    () =>
      buildTimelineBars(
        timelineDriverAssignments,
        timelineWindow.startMs,
        timelineWindow.endMs,
        "driver",
      ),
    [timelineDriverAssignments, timelineWindow.endMs, timelineWindow.startMs],
  );

  const vehicleTimelineBars = useMemo(
    () =>
      buildTimelineBars(
        timelineVehicleAssignments,
        timelineWindow.startMs,
        timelineWindow.endMs,
        "vehicle",
      ),
    [timelineVehicleAssignments, timelineWindow.endMs, timelineWindow.startMs],
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

  const driverNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const driver of driverOptions) {
      if (!driver.driverId) continue;
      map.set(
        driver.driverId,
        driver.name ?? driver.displayName ?? driver.driverId,
      );
    }
    return map;
  }, [driverOptions]);

  const tableAssignments = useMemo(() => {
    const map = new Map<string, TableAssignmentRow>();

    if (allAssignments.length > 0) {
      for (const assignment of allAssignments) {
        const key = `${assignment.assignmentId ?? ""}|${assignment.driverId ?? ""}|${assignment.vin ?? ""}|${assignment.effectiveFrom ?? ""}`;
        if (map.has(key)) continue;
        map.set(key, {
          key,
          assignment,
          driverId: assignment.driverId ?? "—",
          vin: assignment.vin ?? "—",
          effectiveFrom: assignment.effectiveFrom,
          effectiveTo: assignment.effectiveTo,
          assignmentType: assignment.assignmentType,
          source: "All",
        });
      }

      return Array.from(map.values()).sort(
        (a, b) =>
          (parseIsoToMs(b.effectiveFrom) ?? 0) -
          (parseIsoToMs(a.effectiveFrom) ?? 0),
      );
    }

    const upsert = (
      assignment: AssignmentRecord,
      source: "Driver" | "Vehicle",
    ) => {
      const key = `${assignment.assignmentId ?? ""}|${assignment.driverId ?? ""}|${assignment.vin ?? ""}|${assignment.effectiveFrom ?? ""}`;
      const existing = map.get(key);
      if (existing) {
        if (existing.source !== source) {
          existing.source = "Both";
        }
        return;
      }

      map.set(key, {
        key,
        assignment,
        driverId: assignment.driverId ?? "—",
        vin: assignment.vin ?? "—",
        effectiveFrom: assignment.effectiveFrom,
        effectiveTo: assignment.effectiveTo,
        assignmentType: assignment.assignmentType,
        source,
      });
    };

    for (const assignment of driverAssignments) {
      upsert(assignment, "Driver");
    }
    for (const assignment of vehicleAssignments) {
      upsert(assignment, "Vehicle");
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        (parseIsoToMs(b.effectiveFrom) ?? 0) -
        (parseIsoToMs(a.effectiveFrom) ?? 0),
    );
  }, [allAssignments, driverAssignments, vehicleAssignments]);

  const tableDriverOptions = useMemo(
    () =>
      Array.from(
        new Set(tableAssignments.map((row) => row.driverId).filter(Boolean)),
      ).filter((value) => value !== "—"),
    [tableAssignments],
  );

  const tableVinOptions = useMemo(
    () =>
      Array.from(
        new Set(tableAssignments.map((row) => row.vin).filter(Boolean)),
      ).filter((value) => value !== "—"),
    [tableAssignments],
  );

  const filteredTableAssignments = useMemo(() => {
    const filterFromMs = parseDateInputBoundary(tableDateFrom, "start");
    const filterToMs = parseDateInputBoundary(tableDateTo, "end");

    return tableAssignments.filter((row) => {
      if (tableDriverFilter && row.driverId !== tableDriverFilter) return false;
      if (tableVinFilter && row.vin !== tableVinFilter) return false;

      if (filterFromMs === undefined && filterToMs === undefined) return true;

      const startMs = parseIsoToMs(row.effectiveFrom);
      const endMs = parseIsoToMs(row.effectiveTo) ?? Number.POSITIVE_INFINITY;
      if (startMs === undefined) return false;

      if (filterFromMs !== undefined && endMs < filterFromMs) return false;
      if (filterToMs !== undefined && startMs > filterToMs) return false;
      return true;
    });
  }, [tableAssignments, tableDateFrom, tableDateTo, tableDriverFilter, tableVinFilter]);

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
                  {driverOptions.map((driver) => (
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
            <div className="assignment-timeline">
                <div className="assignment-timeline__toolbar">
                  <div className="assignment-timeline__tabs" role="tablist">
                    <button
                      type="button"
                      className={`tab ${timelineView === "timeline" ? "tab--active" : ""}`}
                      onClick={() => setTimelineView("timeline")}
                    >
                      Timeline
                    </button>
                    <button
                      type="button"
                      className={`tab ${timelineView === "table" ? "tab--active" : ""}`}
                      onClick={() => setTimelineView("table")}
                    >
                      Table
                    </button>
                  </div>
                  {timelineView === "timeline" ? (
                    <div className="assignment-timeline__scale" role="group">
                      <button
                        type="button"
                        className={`tab ${timelineScale === "week" ? "tab--active" : ""}`}
                        onClick={() => setTimelineScale("week")}
                      >
                        Week
                      </button>
                      <button
                        type="button"
                        className={`tab ${timelineScale === "month" ? "tab--active" : ""}`}
                        onClick={() => setTimelineScale("month")}
                      >
                        Month
                      </button>
                      <button
                        type="button"
                        className={`tab ${timelineScale === "quarter" ? "tab--active" : ""}`}
                        onClick={() => setTimelineScale("quarter")}
                      >
                        Quarter
                      </button>
                    </div>
                  ) : null}
                </div>

                {timelineView === "timeline" ? (
                  <>
                    <div className="assignment-timeline__window text-muted">
                      {formatDateTime(timelineWindow.startLabel)} → {formatDateTime(timelineWindow.endLabel)}
                    </div>
                    <div className="assignment-timeline__legend text-muted">
                      <span className="assignment-dot assignment-dot--active" />
                      Active
                      <span className="assignment-dot assignment-dot--upcoming" />
                      Upcoming
                      <span className="assignment-dot assignment-dot--ended" />
                      Ended
                      <span className="assignment-dot assignment-dot--conflict" />
                      Conflict
                    </div>

                    <div>
                      <h4>Driver assignments</h4>
                      {driverTimelineBars.length === 0 ? (
                        <p className="text-muted">
                          No assignments found.
                        </p>
                      ) : (
                        <div className="assignment-gantt">
                          {driverTimelineBars.map((bar) => (
                            <div key={bar.key} className="assignment-gantt__row">
                              <div className="assignment-gantt__label">
                                <strong>{bar.label}</strong>
                                <span>{bar.sublabel}</span>
                              </div>
                              <div className="assignment-gantt__track">
                                <div
                                  className={`assignment-gantt__bar assignment-gantt__bar--${bar.status} ${bar.hasConflict ? "assignment-gantt__bar--conflict" : ""}`}
                                  style={{ left: `${bar.leftPercent}%`, width: `${bar.widthPercent}%` }}
                                  title={`${bar.label} • ${bar.startLabel} → ${bar.endLabel}${bar.hasConflict ? " • Conflict" : ""}`}
                                >
                                  <span>{bar.startLabel} → {bar.endLabel}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <h4>Vehicle assignments</h4>
                      {vehicleTimelineBars.length === 0 ? (
                        <p className="text-muted">
                          No assignments found.
                        </p>
                      ) : (
                        <div className="assignment-gantt">
                          {vehicleTimelineBars.map((bar) => (
                            <div key={bar.key} className="assignment-gantt__row">
                              <div className="assignment-gantt__label">
                                <strong>{bar.label}</strong>
                                <span>{bar.sublabel}</span>
                              </div>
                              <div className="assignment-gantt__track">
                                <div
                                  className={`assignment-gantt__bar assignment-gantt__bar--${bar.status} ${bar.hasConflict ? "assignment-gantt__bar--conflict" : ""}`}
                                  style={{ left: `${bar.leftPercent}%`, width: `${bar.widthPercent}%` }}
                                  title={`${bar.label} • ${bar.startLabel} → ${bar.endLabel}${bar.hasConflict ? " • Conflict" : ""}`}
                                >
                                  <span>{bar.startLabel} → {bar.endLabel}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="stack">
                    <div className="form-grid">
                      <label className="form__field">
                        <span className="text-muted">Filter driver</span>
                        <select
                          className="select"
                          value={tableDriverFilter}
                          onChange={(event) =>
                            setTableDriverFilter(event.target.value)
                          }
                        >
                          <option value="">All drivers</option>
                          {tableDriverOptions.map((value) => (
                            <option key={value} value={value}>
                              {driverNameById.get(value) ?? value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form__field">
                        <span className="text-muted">Filter VIN</span>
                        <select
                          className="select"
                          value={tableVinFilter}
                          onChange={(event) => setTableVinFilter(event.target.value)}
                        >
                          <option value="">All VINs</option>
                          {tableVinOptions.map((value) => (
                            <option key={value} value={value}>
                              {value}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form__field">
                        <span className="text-muted">From date</span>
                        <input
                          className="input"
                          type="date"
                          value={tableDateFrom}
                          onChange={(event) => setTableDateFrom(event.target.value)}
                        />
                      </label>
                      <label className="form__field">
                        <span className="text-muted">To date</span>
                        <input
                          className="input"
                          type="date"
                          value={tableDateTo}
                          onChange={(event) => setTableDateTo(event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="inline">
                      <button
                        className="btn btn--ghost"
                        type="button"
                        onClick={() => {
                          setTableDriverFilter("");
                          setTableVinFilter("");
                          setTableDateFrom("");
                          setTableDateTo("");
                        }}
                      >
                        Clear filters
                      </button>
                      <span className="text-muted">
                        Showing {filteredTableAssignments.length} of {tableAssignments.length} assignments
                      </span>
                    </div>

                    {filteredTableAssignments.length === 0 ? (
                      <p className="text-muted">
                        No assignments match the selected filters.
                      </p>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table--assignments">
                          <thead>
                            <tr>
                              <th>Driver</th>
                              <th>VIN</th>
                              <th>Effective from</th>
                              <th>Effective to</th>
                              <th>Type</th>
                              <th>Source</th>
                              <th className="col-actions">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTableAssignments.map((row) => (
                              <tr key={row.key}>
                                <td>{driverNameById.get(row.driverId) ?? row.driverId}</td>
                                <td>{row.vin}</td>
                                <td>{formatDateTime(row.effectiveFrom)}</td>
                                <td>{formatDateTime(row.effectiveTo)}</td>
                                <td>{row.assignmentType ?? "—"}</td>
                                <td>{row.source}</td>
                                <td className="col-actions">
                                  {canEditAssignment ? (
                                    <button
                                      className="btn btn--ghost btn--action"
                                      type="button"
                                      onClick={() =>
                                        handleEditAssignment(row.assignment)
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
                                        handleDeleteAssignment(row.assignment)
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
                )}
              </div>
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

function createAssignmentKey(
  assignment: AssignmentRecord,
  kind: "driver" | "vehicle",
) {
  const primary = kind === "driver" ? assignment.vin : assignment.driverId;
  return `${kind}-${assignment.assignmentId ?? primary ?? "unknown"}-${assignment.effectiveFrom ?? ""}`;
}

function getTimelineStatus(assignment: AssignmentRecord): TimelineStatus {
  const now = Date.now();
  const from = parseIsoToMs(assignment.effectiveFrom);
  const to = parseIsoToMs(assignment.effectiveTo);
  if (from !== undefined && from > now) return "upcoming";
  if (to !== undefined && to < now) return "ended";
  return "active";
}

function detectConflicts(
  assignments: AssignmentRecord[],
  kind: "driver" | "vehicle",
) {
  const conflicts = new Set<string>();
  for (let i = 0; i < assignments.length; i += 1) {
    const current = assignments[i];
    const currentStart = parseIsoToMs(current.effectiveFrom);
    const currentEnd = parseIsoToMs(current.effectiveTo) ?? Number.POSITIVE_INFINITY;
    if (currentStart === undefined) continue;

    for (let j = i + 1; j < assignments.length; j += 1) {
      const next = assignments[j];
      const nextStart = parseIsoToMs(next.effectiveFrom);
      const nextEnd = parseIsoToMs(next.effectiveTo) ?? Number.POSITIVE_INFINITY;
      if (nextStart === undefined) continue;

      const overlaps = currentStart < nextEnd && nextStart < currentEnd;
      if (overlaps) {
        conflicts.add(createAssignmentKey(current, kind));
        conflicts.add(createAssignmentKey(next, kind));
      }
    }
  }
  return conflicts;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function buildTimelineWindow(
  scale: TimelineScale,
  driverAssignments: AssignmentRecord[],
  vehicleAssignments: AssignmentRecord[],
) {
  const now = Date.now();
  const allAssignments = [...driverAssignments, ...vehicleAssignments];

  const starts = allAssignments
    .map((assignment) => parseIsoToMs(assignment.effectiveFrom))
    .filter((value): value is number => value !== undefined);
  const ends = allAssignments
    .map(
      (assignment) => parseIsoToMs(assignment.effectiveTo) ?? now,
    )
    .filter((value): value is number => value !== undefined);

  const oneDay = 24 * 60 * 60 * 1000;
  const targetSpanDays =
    scale === "week" ? 14 : scale === "month" ? 62 : 186;
  const paddingDays =
    scale === "week" ? 2 : scale === "month" ? 7 : 14;

  const minStart = starts.length ? Math.min(...starts) : now - targetSpanDays * oneDay * 0.5;
  const maxEnd = ends.length ? Math.max(...ends) : now + targetSpanDays * oneDay * 0.5;

  let startMs = Math.min(minStart, now - targetSpanDays * oneDay * 0.4) -
    paddingDays * oneDay;
  let endMs = Math.max(maxEnd, now + targetSpanDays * oneDay * 0.4) +
    paddingDays * oneDay;

  if (endMs <= startMs) {
    endMs = startMs + oneDay;
  }

  return {
    startMs,
    endMs,
    startLabel: new Date(startMs).toISOString(),
    endLabel: new Date(endMs).toISOString(),
  };
}

function buildTimelineBars(
  assignments: AssignmentRecord[],
  windowStartMs: number,
  windowEndMs: number,
  kind: "driver" | "vehicle",
): TimelineBar[] {
  const rangeMs = Math.max(1, windowEndMs - windowStartMs);
  const conflicts = detectConflicts(assignments, kind);

  return assignments
    .map((assignment) => {
      const startMs = parseIsoToMs(assignment.effectiveFrom);
      if (startMs === undefined) return null;
      const rawEndMs = parseIsoToMs(assignment.effectiveTo) ?? windowEndMs;
      const endMs = Math.max(startMs, rawEndMs);

      const leftPercent = clampPercent(
        ((startMs - windowStartMs) / rangeMs) * 100,
      );
      const rightPercent = clampPercent(
        ((endMs - windowStartMs) / rangeMs) * 100,
      );
      const widthPercent = Math.max(2, rightPercent - leftPercent);

      const key = createAssignmentKey(assignment, kind);
      const label =
        kind === "driver"
          ? assignment.vin ?? "Unknown VIN"
          : assignment.driverId ?? "Unknown driver";

      return {
        key,
        label,
        sublabel: assignment.assignmentType ?? "PRIMARY",
        leftPercent,
        widthPercent,
        startLabel: formatDateTime(assignment.effectiveFrom),
        endLabel: formatDateTime(assignment.effectiveTo),
        status: getTimelineStatus(assignment),
        hasConflict: conflicts.has(key),
      } satisfies TimelineBar;
    })
    .filter((bar): bar is TimelineBar => Boolean(bar));
}

function parseDateInputBoundary(
  value: string,
  mode: "start" | "end",
) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  if (mode === "end") {
    date.setHours(23, 59, 59, 999);
  }
  return date.getTime();
}
