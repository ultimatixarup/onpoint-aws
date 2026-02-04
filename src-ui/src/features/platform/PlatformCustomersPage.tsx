import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import {
  createCustomer,
  fetchCustomers,
  fetchTenants,
  updateCustomer,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";

export function PlatformCustomersPage() {
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId ? queryKeys.customers(tenantId) : ["customers", "none"],
    queryFn: () => fetchCustomers(tenantId),
    enabled: Boolean(tenantId),
  });

  const [customerId, setCustomerId] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");

  const [editCustomerId, setEditCustomerId] = useState("");
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");

  const handleCreate = async () => {
    if (!tenantId || !name.trim()) return;
    await createCustomer({
      customerId: customerId || undefined,
      tenantId,
      name: name || undefined,
      reason: reason || undefined,
    });
    setCustomerId("");
    setName("");
    setReason("");
    queryClient.invalidateQueries({ queryKey: queryKeys.customers(tenantId) });
  };

  const handleUpdate = async () => {
    if (!editCustomerId) return;
    await updateCustomer(editCustomerId, {
      name: editName || undefined,
      status: editStatus || undefined,
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.customers(tenantId) });
  };

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Customers"
        subtitle="Create and maintain customer profiles by tenant."
      />
      <div className="split-layout">
        <Card title="Customer Actions">
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
              <div className="section__title">Create Customer</div>
              <div className="stack">
                <input
                  className="input"
                  placeholder="Customer ID (optional)"
                  value={customerId}
                  onChange={(event) => setCustomerId(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
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
                  disabled={!tenantId || !name.trim()}
                >
                  Create Customer
                </button>
              </div>
            </div>
            <div className="section">
              <div className="section__title">Edit Customer</div>
              <div className="stack">
                <select
                  className="select"
                  value={editCustomerId}
                  onChange={(event) => setEditCustomerId(event.target.value)}
                >
                  <option value="">Choose customer</option>
                  {customers.map((customer) => (
                    <option
                      key={customer.customerId}
                      value={customer.customerId}
                    >
                      {customer.name ?? customer.customerId}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Name"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                />
                <select
                  className="select"
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <button
                  className="btn"
                  onClick={handleUpdate}
                  disabled={!editCustomerId}
                >
                  Update Customer
                </button>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Customer Directory">
          {!tenantId ? (
            <p>Select a tenant to view customers.</p>
          ) : isLoading ? (
            <p>Loading customers...</p>
          ) : error ? (
            <p>Unable to load customers.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Customer ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.customerId}>
                    <td>{customer.name ?? customer.customerId}</td>
                    <td className="mono">{customer.customerId}</td>
                    <td>
                      <span
                        className={`badge badge--${
                          customer.status?.toLowerCase() ?? "active"
                        }`}
                      >
                        {customer.status ?? "ACTIVE"}
                      </span>
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
