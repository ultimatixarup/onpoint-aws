import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createTenantAdmin,
  createTenantUser,
  fetchTenants,
  fetchUsers,
  setUserPassword,
  setUserStatus,
  updateUserName,
  updateUserRoles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useEnterpriseForm } from "../../hooks/useEnterpriseForm";
import { Card } from "../../ui/Card";
import { Modal } from "../../ui/Modal";
import { TableSkeleton } from "../../ui/TableSkeleton";
import { useToast } from "../../ui/Toast";

export function PlatformUsersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
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

  const createForm = useEnterpriseForm(
    { email: "", name: "", roles: "", tempPassword: "" },
    {
      email: (value) => {
        const text = String(value ?? "").trim();
        if (!text) return "Email is required.";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
          ? null
          : "Enter a valid email address.";
      },
      tempPassword: (value) =>
        String(value ?? "").trim() ? null : "Temporary password is required.",
    },
  );
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);
  const [isAccessSubmitting, setIsAccessSubmitting] = useState(false);
  const [recentUserKey, setRecentUserKey] = useState("");

  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId ? queryKeys.users(tenantId) : ["users", "none"],
    queryFn: () => fetchUsers(tenantId),
    enabled: Boolean(tenantId),
  });

  const [createAdmin, setCreateAdmin] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState("");
  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId),
    [users, selectedUserId],
  );
  const [roleUpdate, setRoleUpdate] = useState("");
  const [nameUpdate, setNameUpdate] = useState("");
  const [resetPassword, setResetPassword] = useState("");

  useEffect(() => {
    if (!selectedUser) return;
    setRoleUpdate(selectedUser.roles?.join(", ") ?? "");
    setNameUpdate(selectedUser.name ?? "");
    setResetPassword("");
  }, [selectedUser]);

  useEffect(() => {
    if (!isCreateOpen) {
      createForm.resetForm({
        email: "",
        name: "",
        roles: "",
        tempPassword: "",
      });
      setCreateAdmin(false);
    }
  }, [createForm.resetForm, isCreateOpen]);

  useEffect(() => {
    setSelectedUserId("");
  }, [tenantId]);

  useEffect(() => {
    if (!recentUserKey) return;
    const timer = window.setTimeout(() => setRecentUserKey(""), 4000);
    return () => window.clearTimeout(timer);
  }, [recentUserKey]);

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
  const selectedRoleList = useMemo(
    () => selectedUser?.roles ?? [],
    [selectedUser],
  );
  const hasRoleChanges =
    Boolean(selectedUser) && normalizedRoleUpdate !== selectedRoles;
  const normalizedNameUpdate = useMemo(() => nameUpdate.trim(), [nameUpdate]);
  const selectedName = useMemo(
    () => (selectedUser?.name ?? "").trim(),
    [selectedUser],
  );
  const hasNameChanges =
    Boolean(selectedUser) && normalizedNameUpdate !== selectedName;
  const hasChanges = hasRoleChanges || hasNameChanges;

  const handleCreateUser = async () => {
    if (!tenantId || isCreateSubmitting) return;
    const errors = createForm.validateAll();
    if (Object.values(errors).some(Boolean)) {
      createForm.focusFirstInvalid({
        order: ["email", "tempPassword", "name", "roles"],
        getId: (field) => `create-${String(field)}`,
      });
      return;
    }

    try {
      setIsCreateSubmitting(true);
      const email = String(createForm.values.email).trim();
      const name = String(createForm.values.name ?? "").trim();
      const tempPassword = String(createForm.values.tempPassword ?? "").trim();
      if (createAdmin) {
        await createTenantAdmin(tenantId, {
          email,
          name: name || undefined,
          tempPassword,
        });
      } else {
        const roleList = String(createForm.values.roles ?? "")
          .split(",")
          .map((role) => role.trim())
          .filter(Boolean);
        await createTenantUser(tenantId, {
          email,
          name: name || undefined,
          roles: roleList,
          tempPassword,
        });
      }
      createForm.resetForm({
        email: "",
        name: "",
        roles: "",
        tempPassword: "",
      });
      setIsCreateOpen(false);
      setRecentUserKey(email.toLowerCase());
      queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
      addToast({ type: "success", message: "User created successfully." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create user.";
      addToast({ type: "error", message });
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleUpdateRoles = async () => {
    if (!tenantId || !selectedUserId || isAccessSubmitting) return;
    try {
      setIsAccessSubmitting(true);
      const roleList = roleUpdate
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
      await updateUserRoles(tenantId, selectedUserId, roleList);
      queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
      addToast({ type: "success", message: "User roles updated." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update roles.";
      addToast({ type: "error", message });
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  const handleUpdateName = async () => {
    if (!tenantId || !selectedUserId || isAccessSubmitting) return;
    const name = normalizedNameUpdate;
    if (!name) {
      addToast({ type: "error", message: "Name is required." });
      return;
    }
    try {
      setIsAccessSubmitting(true);
      await updateUserName(tenantId, selectedUserId, name);
      queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
      addToast({ type: "success", message: "User name updated." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update name.";
      addToast({ type: "error", message });
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!hasChanges || isAccessSubmitting) return;
    if (hasNameChanges) {
      await handleUpdateName();
    }
    if (hasRoleChanges) {
      await handleUpdateRoles();
    }
  };

  const handleResetPassword = async () => {
    if (!tenantId || !selectedUserId || isAccessSubmitting) return;
    const password = resetPassword.trim();
    if (!password) {
      addToast({ type: "error", message: "Temporary password is required." });
      return;
    }
    try {
      setIsAccessSubmitting(true);
      await setUserPassword(
        tenantId,
        selectedUserId,
        {
          password,
          permanent: false,
        },
        "admin",
      );
      setResetPassword("");
      addToast({ type: "success", message: "Temporary password set." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to reset password.";
      addToast({ type: "error", message });
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  const handleToggleStatus = async (enabled: boolean) => {
    if (!tenantId || !selectedUserId || isAccessSubmitting) return;
    try {
      setIsAccessSubmitting(true);
      await setUserStatus(tenantId, selectedUserId, enabled);
      queryClient.invalidateQueries({ queryKey: queryKeys.users(tenantId) });
      addToast({
        type: "success",
        message: `User ${enabled ? "enabled" : "disabled"}.`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to change status.";
      addToast({ type: "error", message });
    } finally {
      setIsAccessSubmitting(false);
    }
  };

  return (
    <div className="page platform-page">
      <section className="platform-hero">
        <div className="platform-hero__glow" />
        <div>
          <p className="platform-hero__eyebrow">Administration</p>
          <h1>Platform Admin – Users</h1>
          <p className="platform-hero__subtitle">
            Provision users, manage roles, and enable or disable access.
          </p>
        </div>
      </section>
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
              <TableSkeleton rows={5} columns={4} />
            ) : error ? (
              <p>Unable to load users.</p>
            ) : filteredUsers.length === 0 ? (
              <div className="stack">
                <p>No users found.</p>
                <button
                  className="btn btn--secondary"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Create your first user
                </button>
              </div>
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
                      className={[
                        user.userId === selectedUserId ? "is-selected" : "",
                        user.userId === recentUserKey ||
                        user.email?.toLowerCase() === recentUserKey
                          ? "is-new"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelectedUserId(user.userId)}
                    >
                      <td className="mono">{user.email}</td>
                      <td>{user.name ?? "—"}</td>
                      <td>{user.roles?.join(", ") ?? "—"}</td>
                      <td>
                        <div className="inline">
                          <span
                            className={`badge badge--${
                              user.enabled ? "active" : "inactive"
                            }`}
                          >
                            {user.enabled ? "ENABLED" : "DISABLED"}
                          </span>
                          {user.cognitoStatus === "FORCE_CHANGE_PASSWORD" ? (
                            <span className="badge badge--attention">
                              FORCE CHANGE
                            </span>
                          ) : null}
                        </div>
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
                      <input
                        className="input"
                        value={nameUpdate}
                        onChange={(event) => setNameUpdate(event.target.value)}
                        placeholder="Required"
                      />
                    </div>
                    <div>
                      <div className="text-muted">Status</div>
                      <div>{selectedUser.enabled ? "ENABLED" : "DISABLED"}</div>
                    </div>
                    <div>
                      <div className="text-muted">Password</div>
                      {selectedUser.cognitoStatus ===
                      "FORCE_CHANGE_PASSWORD" ? (
                        <span className="badge badge--attention">
                          FORCE CHANGE REQUIRED
                        </span>
                      ) : (
                        <span className="text-muted">Normal</span>
                      )}
                    </div>
                    <div>
                      <div className="text-muted">Roles</div>
                      {selectedRoleList.length ? (
                        <div className="assignment-summary">
                          {selectedRoleList.map((role) => (
                            <span key={role} className="assignment-chip">
                              {role}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">No roles assigned</span>
                      )}
                      <button
                        className="btn btn--secondary"
                        type="button"
                        onClick={() => setActiveTab("access")}
                      >
                        Edit roles
                      </button>
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
                      disabled={isAccessSubmitting}
                    >
                      Enable
                    </button>
                    <button
                      className="btn btn--secondary"
                      onClick={() => handleToggleStatus(false)}
                      disabled={isAccessSubmitting}
                    >
                      Disable
                    </button>
                  </div>
                  <div className="divider" />
                  <label className="form__field">
                    <span>Temporary password (forces change)</span>
                    <input
                      className="input"
                      type="password"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      autoComplete="new-password"
                      placeholder="Enter temporary password"
                    />
                  </label>
                  <button
                    className="btn btn--secondary"
                    onClick={handleResetPassword}
                    disabled={isAccessSubmitting || !resetPassword.trim()}
                  >
                    Reset password
                  </button>
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
                  onClick={() => {
                    setRoleUpdate(selectedUser.roles?.join(", ") ?? "");
                    setNameUpdate(selectedUser.name ?? "");
                  }}
                  disabled={isAccessSubmitting}
                >
                  Cancel
                </button>
                <button
                  className={`btn ${isAccessSubmitting ? "btn--loading" : ""}`}
                  onClick={handleSaveChanges}
                  disabled={isAccessSubmitting || !hasChanges}
                >
                  {isAccessSubmitting ? (
                    <span className="btn__spinner" aria-hidden="true" />
                  ) : null}
                  {isAccessSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={isCreateOpen}
        title="Create User"
        onRequestClose={() => setIsCreateOpen(false)}
        isDirty={createForm.isDirty || createAdmin}
        initialFocusId="create-email"
        footer={
          <>
            <button
              className="btn btn--secondary"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreateSubmitting}
            >
              Cancel
            </button>
            <button
              className={`btn ${isCreateSubmitting ? "btn--loading" : ""}`}
              onClick={handleCreateUser}
              disabled={!tenantId || !createForm.isValid || isCreateSubmitting}
            >
              {isCreateSubmitting ? (
                <span className="btn__spinner" aria-hidden="true" />
              ) : null}
              {isCreateSubmitting ? "Creating..." : "Create User"}
            </button>
          </>
        }
      >
        <div className="stack">
          <label className="form__field" htmlFor="create-email">
            <span>
              Email<span className="required">*</span>
            </span>
            <input
              id="create-email"
              name="email"
              className="input"
              placeholder="Email"
              value={String(createForm.values.email)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
              aria-invalid={Boolean(
                createForm.touched.email && createForm.errors.email,
              )}
              aria-describedby={
                createForm.touched.email && createForm.errors.email
                  ? "create-email-error"
                  : undefined
              }
            />
            {createForm.touched.email && createForm.errors.email ? (
              <span id="create-email-error" className="form__error">
                {createForm.errors.email}
              </span>
            ) : null}
          </label>
          <label className="form__field" htmlFor="create-name">
            <span>Name</span>
            <input
              id="create-name"
              name="name"
              className="input"
              placeholder="Optional"
              value={String(createForm.values.name)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
            />
          </label>
          <label className="form__field" htmlFor="create-tempPassword">
            <span>
              Temporary password<span className="required">*</span>
            </span>
            <input
              id="create-tempPassword"
              name="tempPassword"
              className="input"
              type="password"
              placeholder="Required"
              value={String(createForm.values.tempPassword)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
              autoComplete="new-password"
              aria-invalid={Boolean(
                createForm.touched.tempPassword &&
                createForm.errors.tempPassword,
              )}
              aria-describedby={
                createForm.touched.tempPassword &&
                createForm.errors.tempPassword
                  ? "create-tempPassword-error"
                  : undefined
              }
            />
            {createForm.touched.tempPassword &&
            createForm.errors.tempPassword ? (
              <span id="create-tempPassword-error" className="form__error">
                {createForm.errors.tempPassword}
              </span>
            ) : null}
          </label>
          <label className="form__field" htmlFor="create-roles">
            <span>Roles (comma-separated)</span>
            <input
              id="create-roles"
              name="roles"
              className="input"
              placeholder="Optional"
              value={String(createForm.values.roles)}
              onChange={createForm.handleChange}
              onBlur={createForm.handleBlur}
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
      </Modal>
    </div>
  );
}
