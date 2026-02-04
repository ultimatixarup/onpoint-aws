import { useState } from "react";
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

  const [userId, setUserId] = useState("");
  const [roleUpdate, setRoleUpdate] = useState("");

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
    if (!tenantId || !userId) return;
    const roleList = roleUpdate
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
    await updateUserRoles(tenantId, userId, roleList);
    setRoleUpdate("");
    queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
  };

  const handleToggleStatus = async (enabled: boolean) => {
    if (!tenantId || !userId) return;
    await setUserStatus(tenantId, userId, enabled);
    queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
  };

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Users"
        subtitle="Provision users, manage roles, and enable or disable access."
      />
      <div className="split-layout">
        <Card title="User Actions">
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
              <div className="section__title">Create User</div>
              <div className="stack">
                <input
                  className="input"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Name (optional)"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Roles (comma-separated)"
                  value={roles}
                  onChange={(event) => setRoles(event.target.value)}
                  disabled={createAdmin}
                />
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={createAdmin}
                    onChange={(event) => setCreateAdmin(event.target.checked)}
                  />
                  Create tenant admin
                </label>
                <button
                  className="btn"
                  onClick={handleCreateUser}
                  disabled={!tenantId || !email}
                >
                  Create User
                </button>
              </div>
            </div>
            <div className="section">
              <div className="section__title">Update Roles</div>
              <div className="stack">
                <select
                  className="select"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                >
                  <option value="">Choose user</option>
                  {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.email}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  placeholder="Roles (comma-separated)"
                  value={roleUpdate}
                  onChange={(event) => setRoleUpdate(event.target.value)}
                />
                <button
                  className="btn"
                  onClick={handleUpdateRoles}
                  disabled={!userId}
                >
                  Update Roles
                </button>
              </div>
            </div>
            <div className="section">
              <div className="section__title">Access Status</div>
              <div className="stack">
                <select
                  className="select"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                >
                  <option value="">Choose user</option>
                  {users.map((user) => (
                    <option key={user.userId} value={user.userId}>
                      {user.email}
                    </option>
                  ))}
                </select>
                <div className="inline">
                  <button
                    className="btn btn--secondary"
                    onClick={() => handleToggleStatus(true)}
                    disabled={!userId}
                  >
                    Enable
                  </button>
                  <button
                    className="btn btn--secondary"
                    onClick={() => handleToggleStatus(false)}
                    disabled={!userId}
                  >
                    Disable
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card title="User Directory">
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
                {users.map((user) => (
                  <tr key={user.userId}>
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
        </Card>
      </div>
    </div>
  );
}
