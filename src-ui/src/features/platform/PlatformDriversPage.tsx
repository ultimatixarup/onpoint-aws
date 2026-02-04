import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import {
  createDriver,
  fetchDrivers,
  fetchTenants,
  updateDriver,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";

function parseJson(value: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function PlatformDriversPage() {
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");
  const [fleetId, setFleetId] = useState("");

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

  const [editDriverId, setEditDriverId] = useState("");
  const [editFleetId, setEditFleetId] = useState("");
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editMetadata, setEditMetadata] = useState("");

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
        <Card title="Driver Actions">
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
            <div className="section">
              <div className="section__title">Create Driver</div>
              <div className="stack">
                <input
                  className="input"
                  placeholder="Driver ID (optional)"
                  value={driverId}
                  onChange={(event) => setDriverId(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Customer ID (optional)"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                />
                <textarea
                  className="textarea"
                  placeholder='Metadata JSON (optional) e.g. {"license": "A123"}'
                  value={metadata}
                  onChange={(event) => setMetadata(event.target.value)}
                  rows={5}
                />
                <input
                  className="input"
                  placeholder="Reason (optional)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <button
                  className="btn"
                  onClick={handleCreate}
                  disabled={!tenantId}
                >
                  Create Driver
                </button>
              </div>
            </div>
            <div className="section">
              <div className="section__title">Update Driver</div>
              <div className="stack">
                <select
                  className="select"
                  value={editDriverId}
                  onChange={(event) => setEditDriverId(event.target.value)}
                >
                  <option value="">Choose driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.driverId} value={driver.driverId}>
                      {driver.driverId}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Fleet ID (optional)"
                  value={editFleetId}
                  onChange={(event) => setEditFleetId(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Customer ID (optional)"
                  value={editCustomerId}
                  onChange={(event) => setEditCustomerId(event.target.value)}
                />
                <textarea
                  className="textarea"
                  placeholder='Metadata JSON (optional) e.g. {"license": "A123"}'
                  value={editMetadata}
                  onChange={(event) => setEditMetadata(event.target.value)}
                  rows={5}
                />
                <button
                  className="btn"
                  onClick={handleUpdate}
                  disabled={!editDriverId}
                >
                  Update Driver
                </button>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Driver Directory">
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
                  <th>Driver ID</th>
                  <th>Fleet ID</th>
                  <th>Customer ID</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.driverId}>
                    <td className="mono">{driver.driverId}</td>
                    <td className="mono">{driver.fleetId ?? "—"}</td>
                    <td className="mono">{driver.customerId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
