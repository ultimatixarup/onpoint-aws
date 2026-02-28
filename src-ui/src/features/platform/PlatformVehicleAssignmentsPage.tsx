import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
    assignVin,
    fetchFleets,
    fetchTenants,
    fetchVehicles,
    fetchVinRegistryHistory,
    transferVin,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { Card } from "../../ui/Card";

type VinAssignmentHistoryItem = {
  vin?: string;
  tenantId?: string;
  fleetId?: string;
  customerId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  assignmentId?: string;
};

function normalizeIsoForApi(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(raw);
  const candidate = hasTimezone ? raw : `${raw}Z`;
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

export function PlatformVehicleAssignmentsPage() {
  const [vin, setVin] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [fleetId, setFleetId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [reason, setReason] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignStatus, setAssignStatus] = useState<string | null>(null);
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState("");
  const [detailTenantId, setDetailTenantId] = useState("");
  const [detailFleetId, setDetailFleetId] = useState("");
  const [detailCustomerId, setDetailCustomerId] = useState("");
  const [detailEffectiveFrom, setDetailEffectiveFrom] = useState("");
  const [detailEffectiveTo, setDetailEffectiveTo] = useState("");
  const [detailReason, setDetailReason] = useState("");
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailStatus, setDetailStatus] = useState<string | null>(null);
  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);

  const {
    data: tenants = [],
    isLoading: isLoadingTenants,
    error: tenantsError,
  } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });

  const {
    data: fleets = [],
    isLoading: isLoadingFleets,
    error: fleetsError,
  } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
  });

  const {
    data: vehicles = [],
    isLoading: isLoadingVehicles,
    error: vehiclesError,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId || undefined)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId || undefined),
    enabled: Boolean(tenantId),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: vin
      ? ["vin-registry-history", vin, tenantId]
      : ["vin-registry-history", "none"],
    queryFn: () => fetchVinRegistryHistory(vin, tenantId || undefined),
    enabled: Boolean(vin),
  });

  const {
    data: detailFleets = [],
    isLoading: isLoadingDetailFleets,
    error: detailFleetsError,
  } = useQuery({
    queryKey: detailTenantId
      ? queryKeys.fleets(detailTenantId)
      : ["detail-fleets", "none"],
    queryFn: () => fetchFleets(detailTenantId),
    enabled: Boolean(detailTenantId),
  });

  const handleAssign = async () => {
    if (!vin || !tenantId || !effectiveFrom || !reason) return;
    setAssignError(null);
    setAssignStatus(null);

    const normalizedFrom = normalizeIsoForApi(effectiveFrom);
    if (!normalizedFrom) {
      setAssignError("Effective From must be a valid ISO timestamp (example: 2026-02-28T12:00:00Z).");
      return;
    }

    const normalizedTo = effectiveTo.trim()
      ? normalizeIsoForApi(effectiveTo)
      : undefined;
    if (effectiveTo.trim() && !normalizedTo) {
      setAssignError("Effective To must be a valid ISO timestamp (example: 2026-03-01T12:00:00Z).");
      return;
    }

    const idempotencyKey = crypto.randomUUID();
    try {
      await assignVin(
        {
          vin,
          tenantId,
          fleetId: fleetId || undefined,
          customerId: customerId || undefined,
          effectiveFrom: normalizedFrom,
          effectiveTo: normalizedTo,
          reason,
        },
        idempotencyKey,
      );
      setReason("");
      setAssignStatus("Vehicle assigned successfully.");
      refetch();
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Unable to assign vehicle.",
      );
    }
  };

  const assignmentItems = (Array.isArray(data)
    ? data
    : Array.isArray((data as { items?: unknown[] } | undefined)?.items)
      ? (data as { items: unknown[] }).items
      : []) as VinAssignmentHistoryItem[];

  const selectedAssignment = assignmentItems.find((item, index) => {
    const key = item.assignmentId ?? `${item.vin ?? "vin"}-${index}`;
    return key === selectedAssignmentKey;
  });

  const selectAssignment = (
    assignment: VinAssignmentHistoryItem,
    index: number,
  ) => {
    const key = assignment.assignmentId ?? `${assignment.vin ?? "vin"}-${index}`;
    setSelectedAssignmentKey(key);
    setDetailTenantId(assignment.tenantId ?? tenantId);
    setDetailFleetId(assignment.fleetId ?? "");
    setDetailCustomerId(assignment.customerId ?? "");
    setDetailEffectiveFrom(assignment.effectiveFrom ?? "");
    setDetailEffectiveTo(assignment.effectiveTo ?? "");
    setDetailReason("");
    setDetailError(null);
    setDetailStatus(null);
  };

  const handleUpdateAssignment = async () => {
    if (!vin || !selectedAssignment || isUpdatingAssignment) return;

    const nextTenantId = detailTenantId.trim();
    if (!nextTenantId) {
      setDetailError("Tenant is required.");
      return;
    }

    const normalizedFrom = normalizeIsoForApi(detailEffectiveFrom);
    if (!normalizedFrom) {
      setDetailError(
        "Effective From must be a valid ISO timestamp (example: 2026-02-28T12:00:00Z).",
      );
      return;
    }

    const normalizedTo = detailEffectiveTo.trim()
      ? normalizeIsoForApi(detailEffectiveTo)
      : undefined;
    if (detailEffectiveTo.trim() && !normalizedTo) {
      setDetailError(
        "Effective To must be a valid ISO timestamp (example: 2026-03-01T12:00:00Z).",
      );
      return;
    }

    const nextReason = detailReason.trim();
    if (!nextReason) {
      setDetailError("Reason is required.");
      return;
    }

    const currentTenantId = selectedAssignment.tenantId?.trim();
    const currentFrom = normalizeIsoForApi(selectedAssignment.effectiveFrom ?? "");
    let updateEffectiveFrom = normalizedFrom;
    let autoAdjustedFrom = false;
    if (currentTenantId && currentFrom) {
      const nextFromMs = new Date(normalizedFrom).getTime();
      const currentFromMs = new Date(currentFrom).getTime();
      if (nextFromMs <= currentFromMs) {
        updateEffectiveFrom = new Date(currentFromMs + 1000).toISOString();
        autoAdjustedFrom = true;
      }
    }

    setDetailError(null);
    setDetailStatus(null);
    setIsUpdatingAssignment(true);

    const idempotencyKey = crypto.randomUUID();
    try {
      if (currentTenantId) {
        await transferVin(
          {
            vin,
            fromTenantId: currentTenantId,
            toTenantId: nextTenantId,
            toFleetId: detailFleetId.trim() || undefined,
            toCustomerId: detailCustomerId.trim() || undefined,
            effectiveFrom: updateEffectiveFrom,
            reason: nextReason,
          },
          idempotencyKey,
        );
      } else {
        await assignVin(
          {
            vin,
            tenantId: nextTenantId,
            fleetId: detailFleetId.trim() || undefined,
            customerId: detailCustomerId.trim() || undefined,
            effectiveFrom: updateEffectiveFrom,
            effectiveTo: normalizedTo,
            reason: nextReason,
          },
          idempotencyKey,
        );
      }

      if (autoAdjustedFrom) {
        setDetailEffectiveFrom(updateEffectiveFrom);
      }

      setDetailStatus(
        autoAdjustedFrom
          ? `Assignment updated. Effective From was auto-adjusted to ${updateEffectiveFrom} to avoid overlap.`
          : normalizedTo
            ? "Assignment updated. Note: Effective To is not applied in transfer-based updates."
            : "Assignment updated successfully.",
      );
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to update assignment.";
      if (message.toLowerCase().includes("overlaps")) {
        setDetailError(
          "Update overlaps existing history. Pick a later Effective From than the selected record.",
        );
      } else {
        setDetailError(message);
      }
    } finally {
      setIsUpdatingAssignment(false);
    }
  };

  return (
    <div className="page platform-page">
      <section className="platform-hero">
        <div className="platform-hero__glow" />
        <div>
          <p className="platform-hero__eyebrow">Administration</p>
          <h1>Platform Admin – Vehicle Assignment</h1>
          <p className="platform-hero__subtitle">
            Assign vehicles to tenants or fleets and review history.
          </p>
        </div>
      </section>
      <div className="split-layout">
        <Card title="Assignment Actions">
          <div className="stack">
            <label className="form__field">
              <span>Tenant</span>
              <select
                className="select"
                value={tenantId}
                onChange={(event) => {
                  setTenantId(event.target.value);
                  setFleetId("");
                  setVin("");
                }}
                disabled={isLoadingTenants || Boolean(tenantsError)}
              >
                <option value="">Choose tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              {tenantsError ? (
                <span className="text-muted">Unable to load tenants.</span>
              ) : null}
            </label>
            <label className="form__field">
              <span>Fleet</span>
              <select
                className="select"
                value={fleetId}
                onChange={(event) => {
                  setFleetId(event.target.value);
                  setVin("");
                }}
                disabled={!tenantId || isLoadingFleets || Boolean(fleetsError)}
              >
                <option value="">Choose fleet (optional)</option>
                {fleets.map((fleet) => (
                  <option key={fleet.fleetId} value={fleet.fleetId}>
                    {fleet.name ?? fleet.fleetId}
                  </option>
                ))}
              </select>
              {fleetsError ? (
                <span className="text-muted">Unable to load fleets.</span>
              ) : null}
            </label>
            <label className="form__field">
              <span>VIN</span>
              <select
                className="select"
                value={vin}
                onChange={(event) => setVin(event.target.value)}
                disabled={
                  !tenantId || isLoadingVehicles || Boolean(vehiclesError)
                }
              >
                <option value="">Choose vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vin} value={vehicle.vin}>
                    {vehicle.vin}
                  </option>
                ))}
              </select>
              {vehiclesError ? (
                <span className="text-muted">Unable to load vehicles.</span>
              ) : null}
            </label>
            <label className="form__field">
              <span>Customer ID</span>
              <input
                className="input"
                placeholder="Optional"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Effective From (ISO)</span>
              <input
                className="input"
                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Effective To (ISO)</span>
              <input
                className="input"
                placeholder="Optional"
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Reason</span>
              <input
                className="input"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <button
              className="btn"
              onClick={handleAssign}
              disabled={!vin || !tenantId || !effectiveFrom || !reason}
            >
              Assign Vehicle
            </button>
            {assignStatus ? <p className="text-success">{assignStatus}</p> : null}
            {assignError ? <p className="text-danger">{assignError}</p> : null}
          </div>
        </Card>
        <Card title="Assignment History">
          {!vin ? (
            <p>Select a vehicle to view assignments.</p>
          ) : isLoading ? (
            <p>Loading assignments...</p>
          ) : error ? (
            <p>Unable to load assignments.</p>
          ) : assignmentItems.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Fleet</th>
                  <th>Customer</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                </tr>
              </thead>
              <tbody>
                {assignmentItems.map((item, index) => (
                  <tr
                    key={item.assignmentId ?? `${item.vin}-${index}`}
                    className={
                      (item.assignmentId ?? `${item.vin}-${index}`) ===
                      selectedAssignmentKey
                        ? "is-selected"
                        : ""
                    }
                    onClick={() => selectAssignment(item, index)}
                  >
                    <td className="mono">{item.tenantId ?? "—"}</td>
                    <td className="mono">{item.fleetId ?? "—"}</td>
                    <td className="mono">{item.customerId ?? "—"}</td>
                    <td>{item.effectiveFrom ?? "—"}</td>
                    <td>{item.effectiveTo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="code-block">{JSON.stringify(data, null, 2)}</pre>
          )}
        </Card>

        <Card title="Assignment Details">
          {!selectedAssignment ? (
            <p>Select a history row to update assignment details.</p>
          ) : (
            <div className="stack">
              <label className="form__field">
                <span>Tenant</span>
                <select
                  className="select"
                  value={detailTenantId}
                  onChange={(event) => {
                    setDetailTenantId(event.target.value);
                    setDetailFleetId("");
                  }}
                >
                  <option value="">Choose tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form__field">
                <span>Fleet</span>
                <select
                  className="select"
                  value={detailFleetId}
                  onChange={(event) => setDetailFleetId(event.target.value)}
                  disabled={!detailTenantId || isLoadingDetailFleets}
                >
                  <option value="">Unassigned</option>
                  {detailFleets.map((fleet) => (
                    <option key={fleet.fleetId} value={fleet.fleetId}>
                      {fleet.name ?? fleet.fleetId}
                    </option>
                  ))}
                </select>
                {detailFleetsError ? (
                  <span className="text-muted">Unable to load fleets.</span>
                ) : null}
              </label>

              <label className="form__field">
                <span>Customer ID</span>
                <input
                  className="input"
                  placeholder="Optional"
                  value={detailCustomerId}
                  onChange={(event) => setDetailCustomerId(event.target.value)}
                />
              </label>

              <label className="form__field">
                <span>Effective From (ISO)</span>
                <input
                  className="input"
                  placeholder="YYYY-MM-DDTHH:mm:ssZ"
                  value={detailEffectiveFrom}
                  onChange={(event) => setDetailEffectiveFrom(event.target.value)}
                />
              </label>

              <label className="form__field">
                <span>Effective To (ISO)</span>
                <input
                  className="input"
                  placeholder="Optional"
                  value={detailEffectiveTo}
                  onChange={(event) => setDetailEffectiveTo(event.target.value)}
                />
              </label>

              <label className="form__field">
                <span>Reason</span>
                <input
                  className="input"
                  placeholder="Required"
                  value={detailReason}
                  onChange={(event) => setDetailReason(event.target.value)}
                />
              </label>

              <button
                className={`btn ${isUpdatingAssignment ? "btn--loading" : ""}`}
                onClick={handleUpdateAssignment}
                disabled={isUpdatingAssignment || !detailTenantId || !detailEffectiveFrom || !detailReason.trim()}
              >
                {isUpdatingAssignment ? (
                  <span className="btn__spinner" aria-hidden="true" />
                ) : null}
                {isUpdatingAssignment ? "Updating..." : "Update Assignment"}
              </button>

              {detailStatus ? <p className="text-success">{detailStatus}</p> : null}
              {detailError ? <p className="text-danger">{detailError}</p> : null}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
