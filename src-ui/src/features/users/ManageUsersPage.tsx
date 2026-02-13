import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createTenantUser,
  fetchUsers,
  setUserStatus,
  updateUserRoles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

export function ManageUsersPage() {
  const queryClient = useQueryClient();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id;

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [roleUpdate, setRoleUpdate] = useState("");

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId ? queryKeys.users(tenantId, fleetId) : ["users", "none"],
    queryFn: () => fetchUsers(tenantId, fleetId),
    enabled: Boolean(tenantId),
  });

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter((user) =>
      [user.email, user.name, user.userId]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [users, search]);

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId),
    [users, selectedUserId],
  );

  useEffect(() => {
    if (!selectedUser) return;
    setRoleUpdate(selectedUser.roles?.join(", ") ?? "");
  }, [selectedUser]);

  const stats = useMemo(() => {
    const total = users.length;
    const enabled = users.filter((user) => user.enabled).length;
    const disabled = total - enabled;
    return { total, enabled, disabled };
  }, [users]);

  const selectedEnabled = selectedUser?.enabled ?? false;
  const normalizedRoleUpdate = useMemo(
    () =>
      roleUpdate
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean)
        .join(", "),
    [roleUpdate],
  );
  const selectedRoles = useMemo(
    () => (selectedUser?.roles ?? []).join(", "),
    [selectedUser],
  );
  const hasRoleChanges =
    Boolean(selectedUser) && normalizedRoleUpdate !== selectedRoles;

  const handleCreateUser = async () => {
    if (!tenantId || !email) return;
    const roleList = roles.filter(Boolean);
    await createTenantUser(tenantId, {
      email,
      name: name || undefined,
      roles: roleList.length ? roleList : undefined,
    });
    setEmail("");
    setName("");
    setRoles([]);
    queryClient.invalidateQueries({
      queryKey: queryKeys.users(tenantId, fleetId),
    });
  };

  const handleUpdateRoles = async () => {
    if (!tenantId || !selectedUserId) return;
    if (!hasRoleChanges) return;
    const roleList = roleUpdate
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
    await updateUserRoles(tenantId, selectedUserId, roleList);
    queryClient.invalidateQueries({
      queryKey: queryKeys.users(tenantId, fleetId),
    });
  };

  const handleToggleStatus = async (enabled: boolean) => {
    if (!tenantId || !selectedUserId) return;
    const action = enabled ? "enable" : "disable";
    const confirm = window.confirm(
      `Confirm ${action} for ${selectedUser?.email ?? "this user"}? ` +
        "This affects future sign-ins.",
    );
    if (!confirm) return;
    await setUserStatus(tenantId, selectedUserId, enabled);
    queryClient.invalidateQueries({
      queryKey: queryKeys.users(tenantId, fleetId),
    });
  };

  return (
    <div className="page tenant-admin-page">
      <section className="tenant-admin-hero">
        <div className="tenant-admin-hero__glow" />
        <div>
          <p className="tenant-admin-hero__eyebrow">Identity</p>
          <h1>Manage Users</h1>
          <p className="tenant-admin-hero__subtitle">
            Control access, roles, and user lifecycle for this tenant.
          </p>
        </div>
        <div className="tenant-admin-stats">
          <div className="tenant-admin-stat">
            <span>Total users</span>
            <strong>{stats.total}</strong>
            <span className="text-muted">Tenant accounts</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Enabled</span>
            <strong>{stats.enabled}</strong>
            <span className="text-muted">Active access</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Disabled</span>
            <strong>{stats.disabled}</strong>
            <span className="text-muted">Locked accounts</span>
          </div>
        </div>
      </section>

      <div className="split-layout">
        <Card title="Users">
          <div className="stack">
            <label className="form__field">
              <span className="text-muted">Search</span>
              <input
                className="input"
                placeholder="Search by name, email, or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {!tenantId ? (
              <p>Select a tenant to view users.</p>
            ) : isLoading ? (
              <p>Loading users...</p>
            ) : error ? (
              <p>Unable to load users.</p>
            ) : filteredUsers.length === 0 ? (
              <p>No users found for this tenant.</p>
            ) : (
              <div className="table-responsive">
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
              </div>
            )}
          </div>
        </Card>

        <Card title="User Details">
          {!selectedUser ? (
            <div className="empty-state">
              <div className="empty-state__icon">Users</div>
              <h3>Select a user</h3>
              <p className="text-muted">Choose a user to manage roles.</p>
            </div>
          ) : (
            <div className="stack">
              <div className="detail-grid">
                <div>
                  <div className="text-muted">User ID</div>
                  <div className="mono">{selectedUser.userId}</div>
                </div>
                <div>
                  <div className="text-muted">Email</div>
                  <div className="mono">{selectedUser.email ?? "—"}</div>
                </div>
                <div>
                  <div className="text-muted">Status</div>
                  <div>
                    <span
                      className={`badge badge--${
                        selectedEnabled ? "active" : "inactive"
                      }`}
                    >
                      {selectedEnabled ? "ENABLED" : "DISABLED"}
                    </span>
                  </div>
                </div>
              </div>

              <label className="form__field">
                <span className="text-muted">Roles (comma-separated)</span>
                <input
                  className="input"
                  value={roleUpdate}
                  onChange={(event) => setRoleUpdate(event.target.value)}
                />
              </label>
              <div className="inline">
                <button
                  className="btn btn--secondary"
                  onClick={handleUpdateRoles}
                  disabled={!hasRoleChanges}
                >
                  Update roles
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={() => handleToggleStatus(true)}
                  disabled={selectedEnabled}
                >
                  Enable
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={() => handleToggleStatus(false)}
                  disabled={!selectedEnabled}
                >
                  Disable
                </button>
              </div>
              <span className="text-muted">
                Disabling blocks new sign-ins. Existing sessions may remain
                active until they expire.
              </span>
            </div>
          )}
        </Card>
      </div>

      <Card title="Invite User">
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Email</span>
            <input
              className="input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Name</span>
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Roles</span>
            <select
              className="select"
              multiple
              value={roles}
              onChange={(event) => {
                const values = Array.from(event.target.selectedOptions).map(
                  (option) => option.value,
                );
                setRoles(values);
              }}
            >
              <option value="tenant_admin">Tenant Admin</option>
              <option value="fleet_manager">Fleet Manager</option>
              <option value="dispatcher">Dispatcher</option>
              <option value="read_only">Read Only</option>
            </select>
            <span className="text-muted">
              Hold Cmd/Ctrl to select multiple roles.
            </span>
          </label>
        </div>
        <div className="form__actions">
          <button className="btn" onClick={handleCreateUser}>
            Invite user
          </button>
        </div>
      </Card>
    </div>
  );
}
