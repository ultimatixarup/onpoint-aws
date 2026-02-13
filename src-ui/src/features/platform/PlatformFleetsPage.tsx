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
import { Card } from "../../ui/Card";
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
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  const [fleetId, setFleetId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");

  const [selectedFleetId, setSelectedFleetId] = useState("");
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
    if (!tenantId) return;
    await createFleet({
      fleetId: fleetId || undefined,
      tenantId,
      customerId: customerId || undefined,
      name: name || undefined,
      reason: reason || undefined,
    });
    setFleetId("");
    setCustomerId("");
    setName("");
    setReason("");
    queryClient.invalidateQueries({ queryKey: queryKeys.fleets(tenantId) });
  };

  const handleUpdate = async () => {
    if (!editFleetId) return;
    await updateFleet(editFleetId, {
      policies: parseJson(policies),
      reason: editReason || undefined,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.fleets(tenantId) });
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore
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
              <p>Loading fleets...</p>
            ) : error ? (
              <p>Unable to load fleets.</p>
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
                      className={
                        fleet.fleetId === selectedFleetId
                          ? "is-selected"
                          : undefined
                      }
                      onClick={() => setSelectedFleetId(fleet.fleetId)}
                    >
                      <td>{fleet.name ?? fleet.fleetId}</td>
                      <td>
                        <div className="inline">
                          <span className="mono">{fleet.fleetId}</span>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCopy(fleet.fleetId);
                            }}
                          >
                            Copy
                          </button>
                        </div>
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
                      <div className="inline">
                        <span className="mono">{selectedFleet.fleetId}</span>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleCopy(selectedFleet.fleetId)}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Tenant</div>
                      <div>{tenantId}</div>
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
                >
                  Cancel
                </button>
                <button
                  className="btn"
                  onClick={handleUpdate}
                  disabled={!editFleetId}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {isCreateOpen ? (
        <div className="modal__backdrop">
          <div className="modal">
            <div className="modal__header">
              <h2>Create Fleet</h2>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsCreateOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <div className="stack">
                <label className="form__field">
                  <span>Fleet ID</span>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={fleetId}
                    onChange={(event) => setFleetId(event.target.value)}
                  />
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
                  <span>Name</span>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="form__field">
                  <span>Reason</span>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className="modal__footer">
              <button
                className="btn btn--secondary"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
              <button className="btn" onClick={handleCreate}>
                Create Fleet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
