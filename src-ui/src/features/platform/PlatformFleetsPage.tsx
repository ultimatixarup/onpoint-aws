import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
    createFleet,
    fetchCustomers,
    fetchFleets,
    fetchTenants,
    updateFleet,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useEnterpriseForm } from "../../hooks/useEnterpriseForm";
import { Card } from "../../ui/Card";
import { Modal } from "../../ui/Modal";
import { TableSkeleton } from "../../ui/TableSkeleton";
import { useToast } from "../../ui/Toast";
import { formatDate } from "../../utils/date";

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

export function PlatformFleetsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isUpdateSubmitting, setIsUpdateSubmitting] = useState(false);
  const [recentFleetKey, setRecentFleetKey] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "policies" | "audit">(
    "overview",
  );

  const {
    data: fleets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
  });

  const { data: customers = [] } = useQuery({
    queryKey: tenantId ? queryKeys.customers(tenantId) : ["customers", "none"],
    queryFn: () => fetchCustomers(tenantId),
    enabled: Boolean(tenantId),
  });

  const customerNameById = customers.reduce<Record<string, string>>(
    (acc, customer) => {
      const id = customer.customerId;
      if (!id) return acc;
      acc[id] = customer.name ?? id;
      return acc;
    },
    {},
  );

  const createForm = useEnterpriseForm({
    fleetId: "",
    customerId: "",
    name: "",
    reason: "",
  });

  const [selectedFleetId, setSelectedFleetId] = useState("");
  const selectedTenantName = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId)?.name ?? tenantId,
    [tenants, tenantId],
  );
  const selectedFleet = useMemo(
    () => fleets.find((fleet) => fleet.fleetId === selectedFleetId),
    [fleets, selectedFleetId],
  );
  const [editFleetId, setEditFleetId] = useState("");
  const [policies, setPolicies] = useState("");
  const [editReason, setEditReason] = useState("");

  useEffect(() => {
    if (!selectedFleet) return;
    setEditFleetId(selectedFleet.fleetId);
    setPolicies(
      selectedFleet.policies
        ? JSON.stringify(selectedFleet.policies, null, 2)
        : "",
    );
    setEditReason("");
  }, [selectedFleet]);

  useEffect(() => {
    if (!isCreateOpen) {
      createForm.resetForm({
        fleetId: "",
        customerId: "",
        name: "",
        reason: "",
      });
    }
  }, [createForm.resetForm, isCreateOpen]);

  useEffect(() => {
    setSelectedFleetId("");
  }, [tenantId]);

  useEffect(() => {
    if (!recentFleetKey) return;
    const timer = window.setTimeout(() => setRecentFleetKey(""), 4000);
    return () => window.clearTimeout(timer);
  }, [recentFleetKey]);

  const filteredFleets = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return fleets;
    return fleets.filter((fleet) =>
      [fleet.name, fleet.fleetId, fleet.customerId].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [fleets, search]);

  const handleCreate = async () => {
    if (!tenantId || isCreateSubmitting) return;
    const fleetId = String(createForm.values.fleetId ?? "").trim();
    const customerId = String(createForm.values.customerId ?? "").trim();
    const name = String(createForm.values.name ?? "").trim();
    const reason = String(createForm.values.reason ?? "").trim();

    try {
      setIsCreateSubmitting(true);
      await createFleet({
        fleetId: fleetId || undefined,
        tenantId,
        customerId: customerId || undefined,
        name: name || undefined,
        reason: reason || undefined,
      });
      createForm.resetForm({ fleetId: "", customerId: "", name: "", reason: "" });
      setIsCreateOpen(false);
      setRecentFleetKey((fleetId || name).toLowerCase());
      queryClient.invalidateQueries({ queryKey: queryKeys.fleets(tenantId) });
      addToast({ type: "success", message: "Fleet created successfully." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create fleet.";
      addToast({ type: "error", message });
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editFleetId || isUpdateSubmitting) return;
    try {
      setIsUpdateSubmitting(true);
      await updateFleet(editFleetId, {
        policies: parseJson(policies),
        reason: editReason || undefined,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.fleets(tenantId) });
      addToast({ type: "success", message: "Fleet updated." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update fleet.";
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
          <h1>Platform Admin – Fleets</h1>
          <p className="platform-hero__subtitle">
            Create fleets, associate customers, and manage fleet policies.
          </p>
        </div>
      </section>
      <div className="split-layout">
        <Card title="Fleets">
          <div className="stack">
            <label className="form__field">
              <span>Tenant</span>
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
            <div className="inline">
              <input
                className="input"
                placeholder="Search by fleet name, ID, or customer"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="btn"
                onClick={() => setIsCreateOpen(true)}
                disabled={!tenantId}
              >
                Create Fleet
              </button>
            </div>
            {!tenantId ? (
              <p>Select a tenant to view fleets.</p>
            ) : isLoading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : error ? (
              <p>Unable to load fleets.</p>
            ) : filteredFleets.length === 0 ? (
              <div className="stack">
                <p>No fleets found.</p>
                <button
                  className="btn btn--secondary"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create your first fleet
                </button>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Fleet ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFleets.map((fleet) => (
                    <tr
                      key={fleet.fleetId}
                      className={[
                        fleet.fleetId === selectedFleetId ? "is-selected" : "",
                        fleet.fleetId.toLowerCase() === recentFleetKey ||
                        (fleet.name ?? "").toLowerCase() === recentFleetKey
                          ? "is-new"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelectedFleetId(fleet.fleetId)}
                    >
                      <td>{fleet.name ?? fleet.fleetId}</td>
                      <td>
                        <span className="mono">{fleet.fleetId}</span>
                      </td>
                      <td>
                        {fleet.customerId
                          ? (customerNameById[fleet.customerId] ??
                            fleet.customerId)
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge badge--${
                            fleet.status?.toLowerCase() ?? "active"
                          }`}
                        >
                          {fleet.status ?? "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
        <Card title="Fleet Details">
          {!selectedFleet ? (
            <p>Select a fleet to view details.</p>
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
                    activeTab === "policies" ? "tab tab--active" : "tab"
                  }
                  onClick={() => setActiveTab("policies")}
                >
                  Policies
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
                      <div className="text-muted">Fleet ID</div>
                      <div className="mono">{selectedFleet.fleetId}</div>
                    </div>
                    <div>
                      <div className="text-muted">Tenant</div>
                      <div>{selectedTenantName || "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Customer</div>
                      <div>
                        {selectedFleet.customerId
                          ? (customerNameById[selectedFleet.customerId] ??
                            selectedFleet.customerId)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Status</div>
                      <div>{selectedFleet.status ?? "ACTIVE"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Created</div>
                      <div>{formatTimestamp(selectedFleet.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-muted">Updated</div>
                      <div>{formatTimestamp(selectedFleet.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "policies" ? (
                <div className="stack">
                  <label className="form__field">
                    <span>Policies JSON</span>
                    <textarea
                      className="textarea"
                      placeholder='Optional e.g. {"maxSpeed": 75}'
                      value={policies}
                      onChange={(event) => setPolicies(event.target.value)}
                      rows={6}
                    />
                  </label>
                  <label className="form__field">
                    <span>Reason</span>
                    <input
                      className="input"
                      placeholder="Optional"
                      value={editReason}
                      onChange={(event) => setEditReason(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}

              {activeTab === "audit" ? (
                <div className="stack">
                  <p className="text-muted">
                    Audit events are not yet connected. This tab will surface
                    fleet changes and admin activity.
                  </p>
                </div>
              ) : null}

              <div className="form__actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => {
                    if (!selectedFleet) return;
                    setPolicies(
                      selectedFleet.policies
                        ? JSON.stringify(selectedFleet.policies, null, 2)
                        : "",
                    );
                    setEditReason("");
                  }}
                  disabled={isUpdateSubmitting}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${isUpdateSubmitting ? "btn--loading" : ""}`}
                  onClick={handleUpdate}
                  disabled={!editFleetId || isUpdateSubmitting}
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
        title="Create Fleet"
        onRequestClose={() => setIsCreateOpen(false)}
        isDirty={createForm.isDirty}
        initialFocusId="create-fleet-id"
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
              disabled={!tenantId || isCreateSubmitting}
            >
              {isCreateSubmitting ? (
                <span className="btn__spinner" aria-hidden="true" />
              ) : null}
              {isCreateSubmitting ? "Creating..." : "Create Fleet"}
            </button>
          </>
        }
      >
        <div className="stack">
          <label className="form__field" htmlFor="create-fleet-id">
            <span>Fleet ID</span>
            <input
              id="create-fleet-id"
              name="fleetId"
              className="input"
              placeholder="Optional"
              value={String(createForm.values.fleetId)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
            />
          </label>
          <label className="form__field" htmlFor="create-customer-id">
            <span>Customer ID</span>
            <input
              id="create-customer-id"
              name="customerId"
              className="input"
              placeholder="Optional"
              value={String(createForm.values.customerId)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
            />
          </label>
          <label className="form__field" htmlFor="create-fleet-name">
            <span>Name</span>
            <input
              id="create-fleet-name"
              name="name"
              className="input"
              placeholder="Optional"
              value={String(createForm.values.name)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
            />
          </label>
          <label className="form__field" htmlFor="create-fleet-reason">
            <span>Reason</span>
            <input
              id="create-fleet-reason"
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
