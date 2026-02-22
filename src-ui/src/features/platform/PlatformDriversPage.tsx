import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createDriver,
  fetchDrivers,
  fetchTenants,
  updateDriver,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useEnterpriseForm } from "../../hooks/useEnterpriseForm";
import { Card } from "../../ui/Card";
import { Modal } from "../../ui/Modal";
import { TableSkeleton } from "../../ui/TableSkeleton";
import { useToast } from "../../ui/Toast";
import { formatDate } from "../../utils/date";
import { createIdempotencyKey } from "../../utils/id";

function parseJson(value: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function formatTimestamp(value?: string | null) {
  return formatDate(value, "—");
}

export function PlatformDriversPage() {
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
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "audit">(
    "overview",
  );

  const {
    data: drivers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId, fleetId || undefined),
    enabled: Boolean(tenantId),
  });

  const createForm = useEnterpriseForm(
    { driverId: "", customerId: "", metadata: "", reason: "" },
    {
      driverId: (value) =>
        value && String(value).trim() ? null : "Driver ID is required.",
      metadata: (value) => {
        const text = String(value ?? "").trim();
        if (!text) return null;
        return parseJson(text) ? null : "Metadata JSON is invalid.";
      },
    },
  );
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false);
  const [recentDriverId, setRecentDriverId] = useState("");

  const [selectedDriverId, setSelectedDriverId] = useState("");
  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.driverId === selectedDriverId),
    [drivers, selectedDriverId],
  );
  const [editDriverId, setEditDriverId] = useState("");
  const [editFleetId, setEditFleetId] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editMetadata, setEditMetadata] = useState("");

  useEffect(() => {
    if (!selectedDriver) return;
    setEditDriverId(selectedDriver.driverId);
    setEditFleetId(selectedDriver.fleetId ?? "");
    setEditCustomerId(selectedDriver.customerId ?? "");
    setEditMetadata(
      selectedDriver.metadata
        ? JSON.stringify(selectedDriver.metadata, null, 2)
        : "",
    );
  }, [selectedDriver]);

  useEffect(() => {
    if (!isCreateOpen) {
      createForm.resetForm({
        driverId: "",
        customerId: "",
        metadata: "",
        reason: "",
      });
    }
  }, [createForm.resetForm, isCreateOpen]);

  useEffect(() => {
    setSelectedDriverId("");
  }, [tenantId, fleetId]);

  useEffect(() => {
    if (!recentDriverId) return;
    const timer = window.setTimeout(() => setRecentDriverId(""), 4000);
    return () => window.clearTimeout(timer);
  }, [recentDriverId]);

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return drivers;
    return drivers.filter((driver) =>
      [driver.name, driver.driverId, driver.fleetId, driver.customerId].some(
        (value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(term),
      ),
    );
  }, [drivers, search]);

  const handleCreate = async () => {
    if (!tenantId || isCreateSubmitting) return;
    const nextErrors = createForm.validateAll();
    if (Object.values(nextErrors).some(Boolean)) {
      createForm.focusFirstInvalid({
        order: ["driverId", "customerId", "metadata", "reason"],
        getId: (field) => `create-${String(field)}`,
      });
      return;
    }
    try {
      setIsCreateSubmitting(true);
      const createdDriverId = String(createForm.values.driverId).trim();
      await createDriver(
        {
          driverId: createdDriverId || undefined,
          tenantId,
          fleetId: fleetId || undefined,
          customerId:
            String(createForm.values.customerId || "").trim() || undefined,
          metadata: parseJson(String(createForm.values.metadata || "")),
          reason: String(createForm.values.reason || "").trim() || undefined,
        },
        createIdempotencyKey(),
      );
      createForm.resetForm({
        driverId: "",
        customerId: "",
        metadata: "",
        reason: "",
      });
      setIsCreateOpen(false);
      setRecentDriverId(createdDriverId);
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(tenantId, fleetId || undefined),
      });
      addToast({ type: "success", message: "Driver created successfully." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create driver.";
      addToast({ type: "error", message });
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editDriverId || !tenantId || isUpdateSubmitting) return;
    try {
      setIsUpdateSubmitting(true);
      await updateDriver(tenantId, editDriverId, {
        fleetId: editFleetId || undefined,
        customerId: editCustomerId || undefined,
        metadata: parseJson(editMetadata),
      });
      setEditMetadata("");
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(tenantId, fleetId || undefined),
      });
      addToast({ type: "success", message: "Driver updated successfully." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update driver.";
      addToast({ type: "error", message });
    } finally {
      setIsUpdateSubmitting(false);
    }
  };

  return (
    <div className="page platform-page">
      <section className="platform-hero">
        <div className="platform-hero__glow" />
        <div>
          <p className="platform-hero__eyebrow">Administration</p>
          <h1>Platform Admin – Drivers</h1>
          <p className="platform-hero__subtitle">
            Create, update, and monitor drivers by tenant or fleet.
          </p>
        </div>
      </section>
      <div className="split-layout">
        <Card title="Drivers">
          <div className="stack">
            <label className="form__field">
              <span>
                Tenant<span className="required">*</span>
              </span>
              <select
                className="select"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
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
              <span>Fleet (optional)</span>
              <input
                className="input"
                placeholder="Fleet ID"
                value={fleetId}
                onChange={(event) => setFleetId(event.target.value)}
              />
            </label>
            <div className="inline">
              <input
                className="input"
                placeholder="Search by name, ID, fleet, or customer"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="btn"
                onClick={() => setIsCreateOpen(true)}
                disabled={!tenantId}
              >
                Create Driver
              </button>
            </div>
            {!tenantId ? (
              <p>Select a tenant to view drivers.</p>
            ) : isLoading ? (
              <TableSkeleton rows={5} columns={5} />
            ) : error ? (
              <p>Unable to load drivers.</p>
            ) : filteredDrivers.length === 0 ? (
              <div className="stack">
                <p>No drivers found.</p>
                <button
                  className="btn btn--secondary"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create your first driver
                </button>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Driver ID</th>
                    <th>Fleet ID</th>
                    <th>Customer ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrivers.map((driver) => (
                    <tr
                      key={driver.driverId}
                      className={[
                        driver.driverId === selectedDriverId
                          ? "is-selected"
                          : "",
                        driver.driverId === recentDriverId ? "is-new" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelectedDriverId(driver.driverId)}
                    >
                      <td>{driver.name ?? "—"}</td>
                      <td className="mono">{driver.driverId}</td>
                      <td className="mono">{driver.fleetId ?? "—"}</td>
                      <td className="mono">{driver.customerId ?? "—"}</td>
                      <td>
                        <span
                          className={`badge badge--${
                            driver.status?.toLowerCase() ?? "active"
                          }`}
                        >
                          {driver.status ?? "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
        <Card title="Driver Details">
          {!selectedDriver ? (
            <p>Select a driver to view details.</p>
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
                    activeTab === "details" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setActiveTab("details")}
                >
                  Details
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
                      <div className="text-muted">Driver ID</div>
                      <div className="mono">{selectedDriver.driverId}</div>
                    </div>
                    <div>
                      <div className="text-muted">Tenant</div>
                      <div>{tenantId}</div>
                    </div>
                    <div>
                      <div className="text-muted">Fleet ID</div>
                      <div className="mono">
                        {selectedDriver.fleetId ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Customer ID</div>
                      <div className="mono">
                        {selectedDriver.customerId ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Status</div>
                      <div>{selectedDriver.status ?? "ACTIVE"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Created</div>
                      <div>{formatTimestamp(selectedDriver.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-muted">Updated</div>
                      <div>{formatTimestamp(selectedDriver.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "details" ? (
                <div className="stack">
                  <label className="form__field">
                    <span>Fleet ID</span>
                    <input
                      className="input"
                      placeholder="Optional"
                      value={editFleetId}
                      onChange={(event) => setEditFleetId(event.target.value)}
                    />
                  </label>
                  <label className="form__field">
                    <span>Customer ID</span>
                    <input
                      className="input"
                      placeholder="Optional"
                      value={editCustomerId}
                      onChange={(event) =>
                        setEditCustomerId(event.target.value)
                      }
                    />
                  </label>
                  <label className="form__field">
                    <span>Metadata JSON</span>
                    <textarea
                      className="textarea"
                      placeholder='Optional e.g. {"license": "A123"}'
                      value={editMetadata}
                      onChange={(event) => setEditMetadata(event.target.value)}
                      rows={5}
                    />
                  </label>
                </div>
              ) : null}

              {activeTab === "audit" ? (
                <div className="stack">
                  <p className="text-muted">
                    Audit events are not yet connected. This tab will surface
                    driver changes and admin actions.
                  </p>
                </div>
              ) : null}

              <div className="form__actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => {
                    if (!selectedDriver) return;
                    setEditFleetId(selectedDriver.fleetId ?? "");
                    setEditCustomerId(selectedDriver.customerId ?? "");
                    setEditMetadata(
                      selectedDriver.metadata
                        ? JSON.stringify(selectedDriver.metadata, null, 2)
                        : "",
                    );
                  }}
                  disabled={isUpdateSubmitting}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${isUpdateSubmitting ? "btn--loading" : ""}`}
                  onClick={handleUpdate}
                  disabled={isUpdateSubmitting}
                >
                  {isUpdateSubmitting ? (
                    <span className="btn__spinner" aria-hidden="true" />
                  ) : null}
                  {isUpdateSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isCreateOpen}
        title="Create Driver"
        onRequestClose={() => setIsCreateOpen(false)}
        isDirty={createForm.isDirty}
        initialFocusId="create-driverId"
        footer={
          <>
            <button
              className="btn btn--secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreateSubmitting}
            >
              Cancel
            </button>
            <button
              className={`btn ${isCreateSubmitting ? "btn--loading" : ""}`}
              onClick={handleCreate}
              disabled={!tenantId || !createForm.isValid || isCreateSubmitting}
            >
              {isCreateSubmitting ? (
                <span className="btn__spinner" aria-hidden="true" />
              ) : null}
              {isCreateSubmitting ? "Creating..." : "Create Driver"}
            </button>
          </>
        }
      >
        <div className="stack">
          <label className="form__field" htmlFor="create-driverId">
            <span>
              Driver ID<span className="required">*</span>
            </span>
            <input
              id="create-driverId"
              name="driverId"
              className="input"
              placeholder="e.g. driver-001"
              value={String(createForm.values.driverId)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
              aria-invalid={Boolean(
                createForm.touched.driverId && createForm.errors.driverId,
              )}
              aria-describedby={
                createForm.touched.driverId && createForm.errors.driverId
                  ? "create-driverId-error"
                  : undefined
              }
            />
            {createForm.touched.driverId && createForm.errors.driverId ? (
              <span id="create-driverId-error" className="form__error">
                {createForm.errors.driverId}
              </span>
            ) : null}
          </label>
          <label className="form__field" htmlFor="create-customerId">
            <span>Customer ID</span>
            <input
              id="create-customerId"
              name="customerId"
              className="input"
              placeholder="Optional"
              value={String(createForm.values.customerId)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
            />
          </label>
          <label className="form__field" htmlFor="create-metadata">
            <span>Metadata JSON</span>
            <textarea
              id="create-metadata"
              name="metadata"
              className="textarea"
              placeholder='Optional e.g. {"license": "A123"}'
              value={String(createForm.values.metadata)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
              rows={5}
              aria-invalid={Boolean(
                createForm.touched.metadata && createForm.errors.metadata,
              )}
              aria-describedby={
                createForm.touched.metadata && createForm.errors.metadata
                  ? "create-metadata-error"
                  : undefined
              }
            />
            {createForm.touched.metadata && createForm.errors.metadata ? (
              <span id="create-metadata-error" className="form__error">
                {createForm.errors.metadata}
              </span>
            ) : null}
          </label>
          <label className="form__field" htmlFor="create-reason">
            <span>Reason</span>
            <input
              id="create-reason"
              name="reason"
              className="input"
              placeholder="Optional"
              value={String(createForm.values.reason)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
            />
          </label>
        </div>
      </Modal>
    </div>
  );
}
