import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { createTenant, fetchTenants, updateTenant } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";

function parseJson(value: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

const DEFAULT_RETENTION_DAYS = 90;
const DEFAULT_CONFIG = { retentionDays: String(DEFAULT_RETENTION_DAYS) };

export function PlatformTenantsPage() {
  const queryClient = useQueryClient();
  const {
    data: tenants = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });

  const [newTenantId, setNewTenantId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRetentionDays, setNewRetentionDays] = useState(
    String(DEFAULT_RETENTION_DAYS),
  );
  const [newConfig, setNewConfig] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAdvancedCreate, setIsAdvancedCreate] = useState(false);
  const [createErrors, setCreateErrors] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "config" | "audit">(
    "overview",
  );

  const [editTenantId, setEditTenantId] = useState("");
  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === editTenantId),
    [tenants, editTenantId],
  );
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [editRetentionDays, setEditRetentionDays] = useState("");
  const [editConfig, setEditConfig] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editErrors, setEditErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!isAdvancedCreate) {
      const generated = slugify(newName);
      setNewTenantId(generated);
    }
  }, [newName, isAdvancedCreate]);

  useEffect(() => {
    if (!selectedTenant) return;
    setEditName(selectedTenant.name ?? "");
    setEditStatus(selectedTenant.status ?? "ACTIVE");
    setEditRetentionDays(
      selectedTenant.status ? String(selectedTenant.status) : "",
    );
    const retention =
      typeof (selectedTenant as Record<string, unknown>).config === "object" &&
      (selectedTenant as Record<string, unknown>).config
        ? ((selectedTenant as Record<string, unknown>).config as Record<
            string,
            unknown
          >)
        : undefined;
    setEditRetentionDays(
      retention?.retentionDays ? String(retention.retentionDays) : "",
    );
    setEditConfig("");
  }, [selectedTenant]);

  const filteredTenants = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tenants;
    return tenants.filter((tenant) =>
      [tenant.name, tenant.id].some((value) =>
        String(value).toLowerCase().includes(term),
      ),
    );
  }, [tenants, search]);

  const handleCreate = async () => {
    const errors: string[] = [];
    if (!newName.trim()) errors.push("Tenant name is required.");
    if (!newTenantId.trim()) errors.push("Tenant ID is required.");
    const retentionNumber = Number(newRetentionDays);
    if (!Number.isFinite(retentionNumber) || retentionNumber <= 0) {
      errors.push("Retention days must be a positive number.");
    }
    const advancedConfig = newConfig.trim() ? parseJson(newConfig) : undefined;
    if (newConfig.trim() && !advancedConfig) {
      errors.push("Advanced config JSON is invalid.");
    }
    setCreateErrors(errors);
    if (errors.length) return;

    const config = {
      ...DEFAULT_CONFIG,
      retentionDays: String(retentionNumber),
      ...(advancedConfig ?? {}),
    };

    await createTenant({
      tenantId: newTenantId || undefined,
      name: newName,
      config,
      reason: newReason || undefined,
    });
    setNewTenantId("");
    setNewName("");
    setNewRetentionDays(String(DEFAULT_RETENTION_DAYS));
    setNewConfig("");
    setNewReason("");
    setCreateErrors([]);
    setIsCreateOpen(false);
    queryClient.invalidateQueries({
      queryKey: queryKeys.tenants(undefined, true),
    });
  };

  const handleUpdate = async () => {
    if (!editTenantId) return;
    const errors: string[] = [];
    if (!editName.trim()) errors.push("Tenant name is required.");
    const retentionNumber = editRetentionDays
      ? Number(editRetentionDays)
      : undefined;
    if (editRetentionDays && (!retentionNumber || retentionNumber <= 0)) {
      errors.push("Retention days must be a positive number.");
    }
    const advancedConfig = editConfig.trim()
      ? parseJson(editConfig)
      : undefined;
    if (editConfig.trim() && !advancedConfig) {
      errors.push("Advanced config JSON is invalid.");
    }
    setEditErrors(errors);
    if (errors.length) return;

    await updateTenant(editTenantId, {
      name: editName || undefined,
      status: editStatus || undefined,
      config: {
        ...DEFAULT_CONFIG,
        ...(editRetentionDays
          ? { retentionDays: String(retentionNumber) }
          : {}),
        ...(advancedConfig ?? {}),
      },
      reason: editReason || undefined,
    });
    setEditReason("");
    setEditErrors([]);
    queryClient.invalidateQueries({
      queryKey: queryKeys.tenants(undefined, true),
    });
  };

  const handleStatusChange = (value: string) => {
    if (value !== editStatus) {
      const confirmed = window.confirm(
        `Change tenant status to ${value}? This affects all users and data access for the tenant.`,
      );
      if (!confirmed) return;
    }
    setEditStatus(value);
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
          <h1>Platform Admin – Tenants</h1>
          <p className="platform-hero__subtitle">
            Platform-level changes apply across all tenant users and data.
          </p>
        </div>
      </section>
      <div className="banner banner--warning">
        <strong>Warning:</strong> Changes on this page impact tenant-wide
        access, billing scope, and data isolation. Proceed with care.
      </div>
      <div className="split-layout">
        <Card title="Tenants">
          <div className="stack">
            <div className="inline">
              <input
                className="input"
                placeholder="Search by tenant name or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button className="btn" onClick={() => setIsCreateOpen(true)}>
                Create Tenant
              </button>
            </div>
            {isLoading ? (
              <p>Loading tenants...</p>
            ) : error ? (
              <p>Unable to load tenants.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Tenant Name</th>
                    <th>Tenant ID</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className={
                        tenant.id === editTenantId ? "is-selected" : undefined
                      }
                      onClick={() => setEditTenantId(tenant.id)}
                    >
                      <td>{tenant.name}</td>
                      <td>
                        <div className="inline">
                          <span className="mono">{tenant.id}</span>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCopy(tenant.id);
                            }}
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge badge--${tenant.status?.toLowerCase() ?? "active"}`}
                        >
                          {tenant.status ?? "ACTIVE"}
                        </span>
                      </td>
                      <td>
                        {
                          (tenant as Record<string, unknown>)
                            .createdAt as string
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        <Card title="Tenant Details">
          {!selectedTenant ? (
            <p>Select a tenant to view details.</p>
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
                  className={activeTab === "config" ? "tab tab--active" : "tab"}
                  onClick={() => setActiveTab("config")}
                >
                  Configuration
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
                      <div className="text-muted">Tenant ID</div>
                      <div className="inline">
                        <span className="mono">{selectedTenant.id}</span>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleCopy(selectedTenant.id)}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Created</div>
                      <div>
                        {
                          (selectedTenant as Record<string, unknown>)
                            .createdAt as string
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Last Updated</div>
                      <div>
                        {
                          (selectedTenant as Record<string, unknown>)
                            .updatedAt as string
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-muted">Updated By</div>
                      <div>Unknown</div>
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
                      onChange={(event) =>
                        handleStatusChange(event.target.value)
                      }
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="DELETED">DELETED</option>
                    </select>
                  </label>
                </div>
              ) : null}

              {activeTab === "config" ? (
                <div className="stack">
                  <label className="form__field">
                    <span>
                      Retention Policy (days)
                      <span className="text-muted"> – Controls data TTL</span>
                    </span>
                    <input
                      className="input"
                      type="number"
                      value={editRetentionDays}
                      onChange={(event) =>
                        setEditRetentionDays(event.target.value)
                      }
                    />
                  </label>
                  <details>
                    <summary className="text-muted">
                      Advanced configuration (JSON)
                    </summary>
                    <textarea
                      className="textarea"
                      placeholder="Optional"
                      value={editConfig}
                      onChange={(event) => setEditConfig(event.target.value)}
                    />
                    <div className="inline">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() =>
                          setEditConfig(JSON.stringify(DEFAULT_CONFIG, null, 2))
                        }
                      >
                        Reset to defaults
                      </button>
                    </div>
                  </details>
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
                    tenant changes, admin actions, and data access logs.
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
                    setEditName(selectedTenant.name ?? "");
                    setEditStatus(selectedTenant.status ?? "ACTIVE");
                    setEditConfig("");
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
              <h2>Create Tenant</h2>
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
                  <span>Tenant Name</span>
                  <input
                    className="input"
                    placeholder="Human-readable name"
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                  />
                </label>
                <label className="form__field">
                  <span>Tenant ID</span>
                  <input
                    className="input"
                    placeholder="Auto-generated"
                    value={newTenantId}
                    onChange={(event) => setNewTenantId(event.target.value)}
                    readOnly={!isAdvancedCreate}
                  />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={isAdvancedCreate}
                      onChange={(event) =>
                        setIsAdvancedCreate(event.target.checked)
                      }
                    />
                    Enable advanced ID editing
                  </label>
                </label>
                <label className="form__field">
                  <span>Retention Policy (days)</span>
                  <input
                    className="input"
                    type="number"
                    value={newRetentionDays}
                    onChange={(event) =>
                      setNewRetentionDays(event.target.value)
                    }
                  />
                  <span className="text-muted">
                    Controls tenant data retention and billing scope.
                  </span>
                </label>
                <details>
                  <summary className="text-muted">
                    Advanced config (JSON)
                  </summary>
                  <textarea
                    className="textarea"
                    placeholder="Optional"
                    value={newConfig}
                    onChange={(event) => setNewConfig(event.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      setNewConfig(JSON.stringify(DEFAULT_CONFIG, null, 2))
                    }
                  >
                    Reset to defaults
                  </button>
                </details>
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
                Create Tenant
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
