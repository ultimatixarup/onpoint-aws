import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  assignVin,
  createVehicle,
  fetchFleets,
  fetchTenants,
  fetchVehicles,
  updateVehicle,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { Card } from "../../ui/Card";
import { Modal } from "../../ui/Modal";
import { PageHeader } from "../../ui/PageHeader";
import { TableSkeleton } from "../../ui/TableSkeleton";
import { useToast } from "../../ui/Toast";

function parseJson(value: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

const VEHICLE_MAKE_OPTIONS = [
  "Toyota",
  "Ford",
  "Stellantis",
  "GMC",
  "Tesla",
  "Dongle",
] as const;

export function PlatformVehiclesPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");
  const [fleetId, setFleetId] = useState("");

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "audit">(
    "overview",
  );

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
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId || undefined)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId || undefined),
    enabled: Boolean(tenantId),
  });

  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [assignAfterCreate, setAssignAfterCreate] = useState(true);
  const [assignmentReason, setAssignmentReason] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [recentVin, setRecentVin] = useState("");

  const [selectedVin, setSelectedVin] = useState("");
  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.vin === selectedVin),
    [vehicles, selectedVin],
  );
  const [editVin, setEditVin] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [assetTags, setAssetTags] = useState("");
  const [metadata, setMetadata] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [columnWidths, setColumnWidths] = useState(() => ({
    vin: 220,
    make: 90,
    model: 90,
    year: 70,
    status: 110,
  }));
  const [hasUserResized, setHasUserResized] = useState(false);

  useEffect(() => {
    if (!selectedVehicle) return;
    setEditVin(selectedVehicle.vin);
    setEditStatus(selectedVehicle.status ?? "ACTIVE");
    setAssetTags("");
    setMetadata("");
    setUpdateError("");
  }, [selectedVehicle]);

  useEffect(() => {
    if (!isCreateOpen) {
      setCreateError("");
    }
  }, [isCreateOpen]);

  useEffect(() => {
    if (!recentVin) return;
    const timer = window.setTimeout(() => setRecentVin(""), 4000);
    return () => window.clearTimeout(timer);
  }, [recentVin]);

  const filteredVehicles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vehicles;
    return vehicles.filter((vehicle) =>
      [vehicle.vin, vehicle.make, vehicle.model, vehicle.fleetId].some(
        (value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term),
      ),
    );
  }, [vehicles, search]);

  useEffect(() => {
    setHasUserResized(false);
  }, [tenantId, fleetId]);

  useEffect(() => {
    if (hasUserResized) return;
    const sample = vehicles.slice(0, 50);
    const maxText = (values: Array<string | number | undefined>) =>
      values
        .map((value) => String(value ?? ""))
        .reduce((max, value) => (value.length > max.length ? value : max), "");

    const vinText = maxText(sample.map((v) => v.vin));
    const makeText = maxText(sample.map((v) => v.make));
    const modelText = maxText(sample.map((v) => v.model));
    const yearText = maxText(sample.map((v) => v.year));
    const statusText = maxText(sample.map((v) => v.status ?? "ACTIVE"));

    const estimate = (
      text: string,
      min: number,
      max: number,
      charWidth = 8,
    ) => {
      const width = text.length * charWidth + 32;
      return Math.max(min, Math.min(max, width));
    };

    setColumnWidths({
      vin: estimate(vinText, 150, 320, 9),
      make: estimate(makeText, 70, 160),
      model: estimate(modelText, 70, 180),
      year: estimate(yearText, 60, 100),
      status: estimate(statusText, 90, 150),
    });
  }, [hasUserResized, vehicles]);

  const startResize =
    (key: keyof typeof columnWidths) =>
    (event: ReactMouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = columnWidths[key];
      const minWidth = 70;
      const maxWidth = 420;

      setHasUserResized(true);
      const handleMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const next = Math.min(maxWidth, Math.max(minWidth, startWidth + delta));
        setColumnWidths((prev) => ({ ...prev, [key]: next }));
      };

      const handleUp = () => {
        window.removeEventListener("mousemove", handleMove);
        window.removeEventListener("mouseup", handleUp);
      };

      window.addEventListener("mousemove", handleMove);
      window.addEventListener("mouseup", handleUp);
    };

  useEffect(() => {
    if (!selectedVin) return;
    const stillExists = filteredVehicles.some(
      (vehicle) => vehicle.vin === selectedVin,
    );
    if (!stillExists) {
      setSelectedVin("");
    }
  }, [filteredVehicles, selectedVin]);

  const handleCreate = async () => {
    if (!vin || isCreating) return;
    if (!tenantId) {
      setCreateError("Select a tenant before creating a vehicle.");
      return;
    }
    setCreateError("");
    setIsCreating(true);
    try {
      await createVehicle({
        vin,
        make: make || undefined,
        model: model || undefined,
        year: year || undefined,
        status,
      });

      if (assignAfterCreate) {
        const idempotencyKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `assign-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        await assignVin(
          {
            vin,
            tenantId,
            fleetId: fleetId || undefined,
            effectiveFrom: new Date().toISOString(),
            reason: assignmentReason.trim(),
          },
          idempotencyKey,
        );
      }

      setVin("");
      setMake("");
      setModel("");
      setYear("");
      setAssignmentReason("");
      setIsCreateOpen(false);
      setRecentVin(vin);
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles(tenantId, fleetId || undefined),
      });
      addToast({ type: "success", message: "Vehicle created successfully." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Create failed.";
      setCreateError(message);
      addToast({ type: "error", message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editVin || isUpdating) return;
    setUpdateError("");
    setIsUpdating(true);
    try {
      const tags = assetTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      await updateVehicle(editVin, {
        status: editStatus || undefined,
        assetTags: tags.length ? tags : undefined,
        metadata: parseJson(metadata),
      });
      setAssetTags("");
      setMetadata("");
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles(tenantId, fleetId || undefined),
      });
      addToast({ type: "success", message: "Vehicle updated successfully." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed.";
      setUpdateError(message);
      addToast({ type: "error", message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Vehicles"
        subtitle="Register vehicles, manage status, and capture metadata."
      />
      <div className="split-layout split-layout--vehicles">
        <Card title="Vehicles">
          <div className="stack">
            <label className="form__field">
              <span>Tenant</span>
              <select
                className="select"
                value={tenantId}
                onChange={(event) => {
                  setTenantId(event.target.value);
                  setFleetId("");
                  setSelectedVin("");
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
                value={fleetId}
                onChange={(event) => {
                  setFleetId(event.target.value);
                  setSelectedVin("");
                }}
                disabled={!tenantId || isLoadingFleets || Boolean(fleetsError)}
              >
                <option value="">Choose fleet</option>
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
            <div className="inline">
              <input
                className="input"
                placeholder="Search by VIN, make, model, or fleet"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="btn"
                onClick={() => {
                  setCreateError("");
                  setIsCreateOpen(true);
                }}
                disabled={!tenantId}
              >
                Create Vehicle
              </button>
            </div>
            {!tenantId ? (
              <p>Select a tenant to view vehicles.</p>
            ) : isLoading ? (
              <TableSkeleton rows={6} columns={5} />
            ) : error ? (
              <p>Unable to load vehicles.</p>
            ) : filteredVehicles.length === 0 ? (
              <div className="stack">
                <p>No vehicles match this selection.</p>
                <button
                  className="btn btn--secondary"
                  onClick={() => {
                    setCreateError("");
                    setIsCreateOpen(true);
                  }}
                >
                  Create your first vehicle
                </button>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table--vehicles">
                  <colgroup>
                    <col style={{ width: `${columnWidths.vin}px` }} />
                    <col style={{ width: `${columnWidths.make}px` }} />
                    <col style={{ width: `${columnWidths.model}px` }} />
                    <col style={{ width: `${columnWidths.year}px` }} />
                    <col style={{ width: `${columnWidths.status}px` }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="col-vin">
                        VIN
                        <span
                          className="col-resize"
                          onMouseDown={startResize("vin")}
                        />
                      </th>
                      <th className="col-make">
                        Make
                        <span
                          className="col-resize"
                          onMouseDown={startResize("make")}
                        />
                      </th>
                      <th className="col-model">
                        Model
                        <span
                          className="col-resize"
                          onMouseDown={startResize("model")}
                        />
                      </th>
                      <th className="col-year">
                        Year
                        <span
                          className="col-resize"
                          onMouseDown={startResize("year")}
                        />
                      </th>
                      <th className="col-status">
                        Status
                        <span
                          className="col-resize"
                          onMouseDown={startResize("status")}
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => (
                      <tr
                        key={vehicle.vin}
                        className={[
                          vehicle.vin === selectedVin ? "is-selected" : "",
                          vehicle.vin === recentVin ? "is-new" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => setSelectedVin(vehicle.vin)}
                      >
                        <td className="mono col-vin">{vehicle.vin}</td>
                        <td className="col-make">{vehicle.make ?? "—"}</td>
                        <td className="col-model">{vehicle.model ?? "—"}</td>
                        <td className="col-year">{vehicle.year ?? "—"}</td>
                        <td className="col-status">
                          <span
                            className={`badge badge--${
                              vehicle.status?.toLowerCase() ?? "active"
                            }`}
                          >
                            {vehicle.status ?? "ACTIVE"}
                          </span>
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
            <p>Select a vehicle to view details.</p>
          ) : (
            <div className="stack">
              <div className="tabs">
                <button
                  className={
                    activeTab === "overview" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={
                    activeTab === "settings" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setActiveTab("settings")}
                >
                  Settings
                </button>
                <button
                  className={activeTab === "audit" ? "tab tab--active" : "tab"}
                  onClick={() => setActiveTab("audit")}
                >
                  Audit
                </button>
              </div>

              {activeTab === "overview" ? (
                <div className="stack">
                  <div className="detail-grid">
                    <div>
                      <div className="text-muted">VIN</div>
                      <div className="mono">{selectedVehicle.vin}</div>
                    </div>
                    <div>
                      <div className="text-muted">Make</div>
                      <div>{selectedVehicle.make ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Model</div>
                      <div>{selectedVehicle.model ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Year</div>
                      <div>{selectedVehicle.year ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Status</div>
                      <div>{selectedVehicle.status ?? "ACTIVE"}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "settings" ? (
                <div className="stack">
                  <label className="form__field">
                    <span>Status</span>
                    <select
                      className="select"
                      value={editStatus}
                      onChange={(event) => setEditStatus(event.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </label>
                  <label className="form__field">
                    <span>Asset Tags (comma-separated)</span>
                    <input
                      className="input"
                      placeholder="Optional"
                      value={assetTags}
                      onChange={(event) => setAssetTags(event.target.value)}
                    />
                  </label>
                  <label className="form__field">
                    <span>Metadata JSON</span>
                    <textarea
                      className="textarea"
                      placeholder='Optional e.g. {"color": "black"}'
                      value={metadata}
                      onChange={(event) => setMetadata(event.target.value)}
                      rows={5}
                    />
                  </label>
                  {updateError ? (
                    <span className="text-muted">{updateError}</span>
                  ) : null}
                </div>
              ) : null}

              {activeTab === "audit" ? (
                <div className="stack">
                  <p className="text-muted">
                    Audit events are not yet connected. This tab will surface
                    vehicle changes and admin actions.
                  </p>
                </div>
              ) : null}

              <div className="form__actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => {
                    if (!selectedVehicle) return;
                    setEditStatus(selectedVehicle.status ?? "ACTIVE");
                    setAssetTags("");
                    setMetadata("");
                    setUpdateError("");
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${isUpdating ? "btn--loading" : ""}`}
                  onClick={handleUpdate}
                  disabled={!selectedVehicle || isUpdating}
                >
                  {isUpdating ? (
                    <span className="btn__spinner" aria-hidden="true" />
                  ) : null}
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isCreateOpen}
        title="Create Vehicle"
        onRequestClose={() => setIsCreateOpen(false)}
        isDirty={
          Boolean(vin || make || model || year || assignmentReason) ||
          status !== "ACTIVE" ||
          !assignAfterCreate
        }
        initialFocusId="create-vin"
        footer={
          <>
            <button
              className="btn btn--secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              className={`btn ${isCreating ? "btn--loading" : ""}`}
              onClick={handleCreate}
              disabled={
                !vin ||
                isCreating ||
                (assignAfterCreate && !assignmentReason.trim())
              }
            >
              {isCreating ? (
                <span className="btn__spinner" aria-hidden="true" />
              ) : null}
              {isCreating ? "Creating..." : "Create Vehicle"}
            </button>
          </>
        }
      >
        <div className="stack">
          <label className="form__field" htmlFor="create-vin">
            <span>
              VIN<span className="required">*</span>
            </span>
            <input
              id="create-vin"
              className="input"
              placeholder="VIN"
              value={vin}
              onChange={(event) => setVin(event.target.value)}
              aria-invalid={Boolean(!vin.trim() && createError)}
            />
          </label>
          <label className="form__field" htmlFor="create-make">
            <span>Make</span>
            <select
              id="create-make"
              className="select"
              value={make}
              onChange={(event) => setMake(event.target.value)}
            >
              <option value="">Select</option>
              {VEHICLE_MAKE_OPTIONS.map((makeOption) => (
                <option key={makeOption} value={makeOption}>
                  {makeOption}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field" htmlFor="create-model">
            <span>Model</span>
            <input
              id="create-model"
              className="input"
              placeholder="Optional"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            />
          </label>
          <label className="form__field" htmlFor="create-year">
            <span>Year</span>
            <input
              id="create-year"
              className="input"
              placeholder="Optional"
              value={year}
              onChange={(event) => setYear(event.target.value)}
            />
          </label>
          <label className="form__field" htmlFor="create-status">
            <span>Status</span>
            <select
              id="create-status"
              className="select"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <label className="form__field">
            <span>Assign VIN to tenant</span>
            <div className="inline">
              <input
                type="checkbox"
                checked={assignAfterCreate}
                onChange={(event) => setAssignAfterCreate(event.target.checked)}
              />
              <span className="text-muted">
                {fleetId
                  ? `Assign to ${tenantId} / ${fleetId}`
                  : `Assign to ${tenantId}`}
              </span>
            </div>
          </label>
          {assignAfterCreate ? (
            <label className="form__field" htmlFor="create-assignmentReason">
              <span>
                Assignment reason<span className="required">*</span>
              </span>
              <input
                id="create-assignmentReason"
                className="input"
                placeholder="Required"
                value={assignmentReason}
                onChange={(event) => setAssignmentReason(event.target.value)}
                aria-invalid={Boolean(!assignmentReason.trim())}
              />
            </label>
          ) : null}
          {createError ? (
            <span className="form__error">{createError}</span>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
