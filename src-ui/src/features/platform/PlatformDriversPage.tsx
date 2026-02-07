import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
    createDriver,
    fetchDrivers,
    fetchTenants,
    updateDriver,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
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

export function PlatformDriversPage() {
  const queryClient = useQueryClient();
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

  const [driverId, setDriverId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [metadata, setMetadata] = useState("");
  const [reason, setReason] = useState("");

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
    if (!tenantId) return;
    await createDriver({
      driverId: driverId || undefined,
      tenantId,
      fleetId: fleetId || undefined,
      customerId: customerId || undefined,
      metadata: parseJson(metadata),
      reason: reason || undefined,
    });
    setDriverId("");
    setCustomerId("");
    setMetadata("");
    setReason("");
    queryClient.invalidateQueries({
      queryKey: queryKeys.drivers(tenantId, fleetId || undefined),
    });
  };

  const handleUpdate = async () => {
    if (!editDriverId) return;
    await updateDriver(editDriverId, {
      fleetId: editFleetId || undefined,
      customerId: editCustomerId || undefined,
      metadata: parseJson(editMetadata),
    });
    setEditMetadata("");
    queryClient.invalidateQueries({
      queryKey: queryKeys.drivers(tenantId, fleetId || undefined),
    });
  };

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Drivers"
        subtitle="Create, update, and monitor drivers by tenant or fleet."
      />
      <div className="split-layout">
        <Card title="Drivers">
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
              <p>Loading drivers...</p>
            ) : error ? (
              <p>Unable to load drivers.</p>
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
                      className={
                        driver.driverId === selectedDriverId
                          ? "is-selected"
                          : undefined
                      }
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
                >
                  Cancel
                </button>
                <button className="btn" onClick={handleUpdate}>
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
              <h2>Create Driver</h2>
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
                  <span>Driver ID</span>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={driverId}
                    onChange={(event) => setDriverId(event.target.value)}
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
                  <span>Metadata JSON</span>
                  <textarea
                    className="textarea"
                    placeholder='Optional e.g. {"license": "A123"}'
                    value={metadata}
                    onChange={(event) => setMetadata(event.target.value)}
                    rows={5}
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
              <button
                className="btn"
                onClick={handleCreate}
                disabled={!tenantId}
              >
                Create Driver
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
