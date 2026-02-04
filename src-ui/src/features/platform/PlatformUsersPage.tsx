import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import {
  createTenantAdmin,
  createTenantUser,
  fetchTenants,
  fetchUsers,
  setUserStatus,
  updateUserRoles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";

export function PlatformUsersPage() {
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "access" | "audit">(
    "overview",
  );

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId ? queryKeys.users(tenantId) : ["users", "none"],
    queryFn: () => fetchUsers(tenantId),
    enabled: Boolean(tenantId),
  });

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roles, setRoles] = useState("");
  const [createAdmin, setCreateAdmin] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId),
    [users, selectedUserId],
  );
  const [roleUpdate, setRoleUpdate] = useState("");

  useEffect(() => {
    if (!selectedUser) return;
    setRoleUpdate(selectedUser.roles?.join(", ") ?? "");
  }, [selectedUser]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.email, user.name, user.userId].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [users, search]);

  const handleCreateUser = async () => {
    if (!tenantId || !email) return;
    if (createAdmin) {
      await createTenantAdmin(tenantId, { email, name: name || undefined });
    } else {
      const roleList = roles
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
      await createTenantUser(tenantId, {
        email,
        name: name || undefined,
        roles: roleList,
      });
    }
    setEmail("");
    setName("");
    setRoles("");
    queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
  };

  const handleUpdateRoles = async () => {
    if (!tenantId || !selectedUserId) return;
    const roleList = roleUpdate
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
    await updateUserRoles(tenantId, selectedUserId, roleList);
    setRoleUpdate("");
    queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
  };

  const handleToggleStatus = async (enabled: boolean) => {
    if (!tenantId || !selectedUserId) return;
    await setUserStatus(tenantId, selectedUserId, enabled);
    queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
  };

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Users"
        subtitle="Provision users, manage roles, and enable or disable access."
      />
      <div className="split-layout">
        <Card title="Users">
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
                placeholder="Search by name, email, or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="btn"
                onClick={() => setIsCreateOpen(true)}
                disabled={!tenantId}
              >
                Create User
              </button>
            </div>
            {!tenantId ? (
              <p>Select a tenant to view users.</p>
            ) : isLoading ? (
              <p>Loading users...</p>
            ) : error ? (
              <p>Unable to load users.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Roles</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.userId}
                      className={
                        user.userId === selectedUserId
                          ? "is-selected"
                          : undefined
                      }
                      onClick={() => setSelectedUserId(user.userId)}
                    >
                      <td className="mono">{user.email}</td>
                      <td>{user.name ?? "—"}</td>
                      <td>{user.roles?.join(", ") ?? "—"}</td>
                      <td>
                        <span
                          className={`badge badge--${
                            user.enabled ? "active" : "inactive"
                          }`}
                        >
                          {user.enabled ? "ENABLED" : "DISABLED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
        <Card title="User Details">
          {!selectedUser ? (
            <p>Select a user to view details.</p>
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
                  className={activeTab === "access" ? "tab tab--active" : "tab"}
                  onClick={() => setActiveTab("access")}
                >
                  Access
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
                      <div className="text-muted">User ID</div>
                      <div className="mono">{selectedUser.userId}</div>
                    </div>
                    <div>
                      <div className="text-muted">Email</div>
                      <div className="mono">{selectedUser.email}</div>
                    </div>
                    <div>
                      <div className="text-muted">Name</div>
                      <div>{selectedUser.name ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Status</div>
                      <div>{selectedUser.enabled ? "ENABLED" : "DISABLED"}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === "access" ? (
                <div className="stack">
                  <label className="form__field">
                    <span>Roles (comma-separated)</span>
                    <input
                      className="input"
                      value={roleUpdate}
                      onChange={(event) => setRoleUpdate(event.target.value)}
                    />
                  </label>
                  <div className="inline">
                    <button
                      className="btn btn--secondary"
                      onClick={() => handleToggleStatus(true)}
                    >
                      Enable
                    </button>
                    <button
                      className="btn btn--secondary"
                      onClick={() => handleToggleStatus(false)}
                    >
                      Disable
                    </button>
                  </div>
                </div>
              ) : null}

              {activeTab === "audit" ? (
                <div className="stack">
                  <p className="text-muted">
                    Audit events are not yet connected. This tab will surface
                    user changes and access history.
                  </p>
                </div>
              ) : null}

              <div className="form__actions">
                <button
                  className="btn btn--secondary"
                  onClick={() =>
                    setRoleUpdate(selectedUser.roles?.join(", ") ?? "")
                  }
                >
                  Cancel
                </button>
                <button className="btn" onClick={handleUpdateRoles}>
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
              <h2>Create User</h2>
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
                  <span>Email</span>
                  <input
                    className="input"
                    placeholder="Email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
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
                  <span>Roles (comma-separated)</span>
                  <input
                    className="input"
                    placeholder="Optional"
                    value={roles}
                    onChange={(event) => setRoles(event.target.value)}
                    disabled={createAdmin}
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={createAdmin}
                    onChange={(event) => setCreateAdmin(event.target.checked)}
                  />
                  Create tenant admin
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
                onClick={handleCreateUser}
                disabled={!tenantId || !email}
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
