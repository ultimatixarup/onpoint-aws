import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
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

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "audit">("overview");

  const [newCustomerId, setNewCustomerId] = useState("");
  const [newName, setNewName] = useState("");
  const [newReason, setNewReason] = useState("");

  const [editCustomerId, setEditCustomerId] = useState("");
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.customerId === editCustomerId),
    [customers, editCustomerId],
  );
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editReason, setEditReason] = useState("");
  const [editErrors, setEditErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedCustomer) return;
    setEditName(selectedCustomer.name ?? "");
    setEditStatus(selectedCustomer.status ?? "ACTIVE");
    setEditReason("");
  }, [selectedCustomer]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.customerId].some((value) =>
        String(value).toLowerCase().includes(term),
      ),
    );
  }, [customers, search]);

  const handleCreate = async () => {
    const errors: string[] = [];
    if (!tenantId) errors.push("Tenant is required.");
    if (!newName.trim()) errors.push("Customer name is required.");
    setCreateErrors(errors);
    if (errors.length) return;

    await createCustomer({
      customerId: newCustomerId || undefined,
      tenantId,
      name: newName || undefined,
      reason: newReason || undefined,
    });
    setNewCustomerId("");
    setNewName("");
    setNewReason("");
    setCreateErrors([]);
    setIsCreateOpen(false);
    queryClient.invalidateQueries({ queryKey: queryKeys.customers(tenantId) });
  };

  const handleUpdate = async () => {
    if (!editCustomerId) return;
    const errors: string[] = [];
    if (!editName.trim()) errors.push("Customer name is required.");
    setEditErrors(errors);
    if (errors.length) return;

    await updateCustomer(editCustomerId, {
      name: editName || undefined,
      status: editStatus || undefined,
      reason: editReason || undefined,
    });
    setEditReason("");
    setEditErrors([]);
    queryClient.invalidateQueries({ queryKey: queryKeys.customers(tenantId) });
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
          <h1>Platform Admin – Customers</h1>
          <p className="platform-hero__subtitle">
            Create and maintain customer profiles by tenant.
          </p>
        </div>
      </section>
      <div className="split-layout">
        <Card title="Customers">
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
                placeholder="Search by customer name or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button className="btn" onClick={() => setIsCreateOpen(true)}>
                Create Customer
              </button>
            </div>
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
                    <th>Customer Name</th>
                    <th>Customer ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.customerId}
                      className={
                        customer.customerId === editCustomerId
                          ? "is-selected"
                          : undefined
                      }
                      onClick={() => setEditCustomerId(customer.customerId)}
                    >
                      <td>{customer.name ?? customer.customerId}</td>
                      <td>
                        <div className="inline">
                          <span className="mono">{customer.customerId}</span>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCopy(customer.customerId);
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </td>
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
          </div>
        </Card>

        <Card title="Customer Details">
          {!selectedCustomer ? (
            <p>Select a customer to view details.</p>
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
                      <div className="text-muted">Customer ID</div>
                      <div className="inline">
                        <span className="mono">
                          {selectedCustomer.customerId}
                        </span>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() =>
                            handleCopy(selectedCustomer.customerId)
                          }
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Tenant</div>
                      <div>{selectedCustomer.tenantId ?? tenantId}</div>
                    </div>
                    <div>
                      <div className="text-muted">Status</div>
                      <div>{selectedCustomer.status ?? "ACTIVE"}</div>
                    </div>
                  </div>
                  <label className="form__field">
                    <span>Name</span>
                    <input
                      className="input"
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                    />
                  </label>
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
                    Audit history is not yet connected. This tab will show
                    customer changes and administrative actions.
                  </p>
                </div>
              ) : null}

              {editErrors.length ? (
                <div className="error">{editErrors.join(" ")}</div>
              ) : null}
              <div className="form__actions">
                <button
                  className="btn btn--secondary"
                  onClick={() => {
                    setEditName(selectedCustomer.name ?? "");
                    setEditStatus(selectedCustomer.status ?? "ACTIVE");
                    setEditReason("");
                    setEditErrors([]);
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
              <h2>Create Customer</h2>
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
                  <span>Customer Name</span>
                  <input
                    className="input"
                    placeholder="Human-readable name"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                  />
                </label>
                <label className="form__field">
                  <span>Customer ID</span>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={newCustomerId}
                    onChange={(event) => setNewCustomerId(event.target.value)}
                  />
                </label>
                <label className="form__field">
                  <span>Reason</span>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={newReason}
                    onChange={(event) => setNewReason(event.target.value)}
                  />
                </label>
                {createErrors.length ? (
                  <div className="error">{createErrors.join(" ")}</div>
                ) : null}
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
                Create Customer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
