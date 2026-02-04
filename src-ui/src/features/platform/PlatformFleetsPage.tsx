import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import {
  createFleet,
  fetchCustomers,
  fetchFleets,
  fetchTenants,
  updateFleet,
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

function formatTimestamp(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function PlatformFleetsPage() {
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");

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

  const [editFleetId, setEditFleetId] = useState("");
  const [policies, setPolicies] = useState("");

  const handleCreate = async () => {
    if (!tenantId) return;
    await createFleet({
      fleetId: fleetId || undefined,
      tenantId,
      customerId: customerId || undefined,
      name: name || undefined,
    });
    setFleetId("");
    setCustomerId("");
    setName("");
    queryClient.invalidateQueries({ queryKey: queryKeys.fleets(tenantId) });
  };

  const handleUpdate = async () => {
    if (!editFleetId) return;
    await updateFleet(editFleetId, { policies: parseJson(policies) });
    setPolicies("");
    queryClient.invalidateQueries({ queryKey: queryKeys.fleets(tenantId) });
  };

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Fleets"
        subtitle="Create fleets, associate customers, and manage fleet policies."
      />
      <div className="split-layout">
        <Card title="Fleet Actions">
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
            <div className="section">
              <div className="section__title">Create Fleet</div>
              <div className="stack">
                <input
                  className="input"
                  placeholder="Fleet ID (optional)"
                  value={fleetId}
                  onChange={(event) => setFleetId(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Customer ID (optional)"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <button
                  className="btn"
                  onClick={handleCreate}
                  disabled={!tenantId}
                >
                  Create Fleet
                </button>
              </div>
            </div>
            <div className="section">
              <div className="section__title">Update Policies</div>
              <div className="stack">
                <select
                  className="select"
                  value={editFleetId}
                  onChange={(event) => setEditFleetId(event.target.value)}
                >
                  <option value="">Choose fleet</option>
                  {fleets.map((fleet) => (
                    <option key={fleet.fleetId} value={fleet.fleetId}>
                      {fleet.name ?? fleet.fleetId}
                    </option>
                  ))}
                </select>
                <textarea
                  className="textarea"
                  placeholder='Policies JSON (optional) e.g. {"maxSpeed": 75}'
                  value={policies}
                  onChange={(event) => setPolicies(event.target.value)}
                  rows={6}
                />
                <button
                  className="btn"
                  onClick={handleUpdate}
                  disabled={!editFleetId}
                >
                  Update Policies
                </button>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Fleet Directory">
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
                  <th>Created</th>
                  <th>Updated</th>
                  <th>Policies</th>
                </tr>
              </thead>
              <tbody>
                {fleets.map((fleet) => (
                  <tr key={fleet.fleetId}>
                    <td>{fleet.name ?? fleet.fleetId}</td>
                    <td className="mono">{fleet.fleetId}</td>
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
                    <td>{formatTimestamp(fleet.createdAt)}</td>
                    <td>{formatTimestamp(fleet.updatedAt)}</td>
                    <td className="mono">
                      {fleet.policies ? JSON.stringify(fleet.policies) : "—"}
                    </td>
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
