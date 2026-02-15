import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  createDriver,
  deactivateDriver,
  deleteDriver,
  fetchDrivers,
  fetchFleets,
  updateDriver,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useAuth } from "../../context/AuthContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { createIdempotencyKey } from "../../utils/id";

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

function normalizeStatus(value?: string) {
  return (value ?? "unknown").toLowerCase();
}

function toBadgeClass(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "active") return "badge badge--active";
  if (normalized === "inactive") return "badge badge--inactive";
  if (normalized === "suspended") return "badge badge--suspended";
  return "badge";
}

function sanitize(value: string) {
  return value.trim();
}

export function TenantDriverAdminPage() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const { tenant } = useTenant();
  const tenantId = tenant?.id ?? "";

  const [search, setSearch] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    employeeId: "",
    externalRef: "",
    fleetId: "",
  });
  const [editStatus, setEditStatus] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    employeeId: "",
    externalRef: "",
    fleetId: "",
    status: "ACTIVE",
    reason: "Tenant admin created",
  });
  const [createStatus, setCreateStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: drivers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId ? queryKeys.drivers(tenantId) : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId),
    enabled: Boolean(tenantId),
  });

  const { data: fleets = [] } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return drivers;
    return drivers.filter((driver) =>
      [
        driver.displayName,
        driver.name,
        driver.driverId,
        driver.email,
        driver.phone,
        driver.employeeId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [drivers, search]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.driverId === selectedDriverId),
    [drivers, selectedDriverId],
  );

  useEffect(() => {
    if (!selectedDriver) {
      setEditForm({
        displayName: "",
        email: "",
        phone: "",
        employeeId: "",
        externalRef: "",
        fleetId: "",
      });
      return;
    }
    setEditForm({
      displayName: selectedDriver.displayName ?? selectedDriver.name ?? "",
      email: selectedDriver.email ?? "",
      phone: selectedDriver.phone ?? "",
      employeeId: selectedDriver.employeeId ?? "",
      externalRef: selectedDriver.externalRef ?? "",
      fleetId: selectedDriver.fleetId ?? "",
    });
  }, [selectedDriver]);

  const stats = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter(
      (driver) => normalizeStatus(driver.status) === "active",
    ).length;
    const inactive = drivers.filter(
      (driver) => normalizeStatus(driver.status) === "inactive",
    ).length;
    const unassigned = drivers.filter((driver) => !driver.fleetId).length;
    return { total, active, inactive, unassigned };
  }, [drivers]);

  const hasChanges = useMemo(() => {
    if (!selectedDriver) return false;
    const compareName = selectedDriver.displayName ?? selectedDriver.name ?? "";
    return (
      sanitize(editForm.displayName) !== sanitize(compareName) ||
      sanitize(editForm.email) !== sanitize(selectedDriver.email ?? "") ||
      sanitize(editForm.phone) !== sanitize(selectedDriver.phone ?? "") ||
      sanitize(editForm.employeeId) !==
        sanitize(selectedDriver.employeeId ?? "") ||
      sanitize(editForm.externalRef) !==
        sanitize(selectedDriver.externalRef ?? "") ||
      sanitize(editForm.fleetId) !== sanitize(selectedDriver.fleetId ?? "")
    );
  }, [editForm, selectedDriver]);

  const roleHeader = useMemo(() => {
    if (roles.includes("platform_admin")) return "admin";
    if (roles.includes("tenant_admin")) return "tenant-admin";
    if (roles.includes("fleet_manager")) return "fleet-manager";
    if (roles.includes("dispatcher")) return "analyst";
    if (roles.includes("read_only")) return "read-only";
    return undefined;
  }, [roles]);

  const handleUpdate = async () => {
    if (!tenantId || !selectedDriver) return;
    if (!sanitize(editForm.displayName)) {
      setEditError("Driver name is required.");
      return;
    }
    setEditError(null);
    setEditStatus(null);
    try {
      await updateDriver(
        tenantId,
        selectedDriver.driverId,
        {
          displayName: sanitize(editForm.displayName),
          email: sanitize(editForm.email) || undefined,
          phone: sanitize(editForm.phone) || undefined,
          employeeId: sanitize(editForm.employeeId) || undefined,
          externalRef: sanitize(editForm.externalRef) || undefined,
          fleetId: sanitize(editForm.fleetId) || undefined,
          reason: "Tenant admin update",
        },
        roleHeader,
      );
      setEditStatus("Driver updated.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(tenantId),
      });
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Unable to update driver.",
      );
    }
  };

  const handleDeactivate = async () => {
    if (!tenantId || !selectedDriver) return;
    const confirm = window.confirm(
      `Deactivate ${selectedDriver.displayName ?? selectedDriver.driverId}?`,
    );
    if (!confirm) return;
    setEditError(null);
    setEditStatus(null);
    try {
      await deactivateDriver(tenantId, selectedDriver.driverId, roleHeader);
      setEditStatus("Driver deactivated.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(tenantId),
      });
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Unable to deactivate driver.",
      );
    }
  };

  const handleDelete = async () => {
    if (!tenantId || !selectedDriver) return;
    const confirmation = window.prompt(
      `Type ${selectedDriver.driverId} to permanently delete this driver.`,
    );
    if (confirmation !== selectedDriver.driverId) return;
    setEditError(null);
    setEditStatus(null);
    try {
      await deleteDriver(tenantId, selectedDriver.driverId, roleHeader);
      setSelectedDriverId("");
      setEditStatus("Driver permanently deleted.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(tenantId),
      });
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Unable to delete driver.",
      );
    }
  };

  const handleCreate = async () => {
    if (!tenantId || !sanitize(createForm.displayName)) {
      setCreateError("Driver name is required.");
      return;
    }
    setCreateError(null);
    setCreateStatus(null);
    try {
      await createDriver(
        {
          tenantId,
          displayName: sanitize(createForm.displayName),
          email: sanitize(createForm.email) || undefined,
          phone: sanitize(createForm.phone) || undefined,
          employeeId: sanitize(createForm.employeeId) || undefined,
          externalRef: sanitize(createForm.externalRef) || undefined,
          fleetId: sanitize(createForm.fleetId) || undefined,
          status: createForm.status,
          reason: createForm.reason,
        },
        createIdempotencyKey(),
        roleHeader,
      );
      setCreateStatus("Driver added.");
      setCreateForm({
        displayName: "",
        email: "",
        phone: "",
        employeeId: "",
        externalRef: "",
        fleetId: "",
        status: "ACTIVE",
        reason: "Tenant admin created",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.drivers(tenantId),
      });
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Unable to create driver.",
      );
    }
  };

  const selectedStatus = normalizeStatus(selectedDriver?.status);
  const isInactive = selectedStatus === "inactive";

  return (
    <div className="page tenant-admin-page">
      <section className="tenant-admin-hero">
        <div className="tenant-admin-hero__glow" />
        <div>
          <p className="tenant-admin-hero__eyebrow">Driver admin</p>
          <h1>Manage Drivers</h1>
          <p className="tenant-admin-hero__subtitle">
            Control driver profiles, fleet assignments, and lifecycle changes
            without leaving the tenant console.
          </p>
        </div>
        <div className="tenant-admin-stats">
          <div className="tenant-admin-stat">
            <span>Total drivers</span>
            <strong>{stats.total}</strong>
            <span className="text-muted">Roster size</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Active</span>
            <strong>{stats.active}</strong>
            <span className="text-muted">Ready to dispatch</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
            <span className="text-muted">Offboarded or paused</span>
          </div>
          <div className="tenant-admin-stat">
            <span>Unassigned</span>
            <strong>{stats.unassigned}</strong>
            <span className="text-muted">Need fleet mapping</span>
          </div>
        </div>
      </section>

      <div className="split-layout">
        <Card title="Drivers">
          <div className="stack">
            <label className="form__field">
              <span className="text-muted">Search</span>
              <input
                className="input"
                placeholder="Search by name, ID, email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {!tenantId ? (
              <p>Select a tenant to view drivers.</p>
            ) : isLoading ? (
              <p>Loading drivers...</p>
            ) : error ? (
              <p>Unable to load drivers.</p>
            ) : filteredDrivers.length === 0 ? (
              <p>No drivers found for this tenant.</p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Fleet</th>
                      <th>Status</th>
                      <th>Contact</th>
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
                        <td>
                          <div>{driver.displayName ?? driver.name ?? "—"}</div>
                          <div className="text-muted mono">
                            {driver.driverId}
                          </div>
                        </td>
                        <td>{driver.fleetId ?? "Unassigned"}</td>
                        <td>
                          <span className={toBadgeClass(driver.status)}>
                            {driver.status ?? "Unknown"}
                          </span>
                        </td>
                        <td>
                          <div>{driver.email ?? "—"}</div>
                          <div className="text-muted">
                            {driver.phone ?? "—"}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card title="Driver Details">
          {!selectedDriver ? (
            <div className="empty-state">
              <div className="empty-state__icon">Drivers</div>
              <h3>Select a driver</h3>
              <p className="text-muted">
                Choose a driver to manage their profile and fleet assignment.
              </p>
            </div>
          ) : (
            <div className="stack">
              <div className="detail-grid">
                <div>
                  <div className="text-muted">Driver ID</div>
                  <div className="mono">{selectedDriver.driverId}</div>
                </div>
                <div>
                  <div className="text-muted">Status</div>
                  <span className={toBadgeClass(selectedDriver.status)}>
                    {selectedDriver.status ?? "Unknown"}
                  </span>
                </div>
                <div>
                  <div className="text-muted">Current fleet</div>
                  <div>{selectedDriver.fleetId ?? "Unassigned"}</div>
                </div>
              </div>

              {editStatus ? (
                <div className="form-success">{editStatus}</div>
              ) : null}
              {editError ? <div className="form-error">{editError}</div> : null}

              <div className="form-grid">
                <label className="form__field">
                  <span className="text-muted">Driver name</span>
                  <input
                    className="input"
                    value={editForm.displayName}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        displayName: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Email</span>
                  <input
                    className="input"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Phone</span>
                  <input
                    className="input"
                    value={editForm.phone}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Employee ID</span>
                  <input
                    className="input"
                    value={editForm.employeeId}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        employeeId: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">External reference</span>
                  <input
                    className="input"
                    value={editForm.externalRef}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        externalRef: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="form__field">
                  <span className="text-muted">Fleet assignment</span>
                  <select
                    className="select"
                    value={editForm.fleetId}
                    onChange={(event) =>
                      setEditForm((prev) => ({
                        ...prev,
                        fleetId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {fleets.map((fleet) => (
                      <option key={fleet.fleetId} value={fleet.fleetId}>
                        {fleet.name ?? fleet.fleetId}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="inline">
                <button
                  className="btn btn--secondary"
                  onClick={handleUpdate}
                  disabled={!hasChanges}
                >
                  Save changes
                </button>
                <button
                  className="btn btn--secondary"
                  onClick={handleDeactivate}
                  disabled={isInactive}
                >
                  Deactivate driver
                </button>
                <button className="btn btn--danger" onClick={handleDelete}>
                  Delete permanently
                </button>
              </div>
              <span className="text-muted">
                Deactivation keeps historical data but removes the driver from
                active dispatch.
              </span>
              <span className="text-muted">
                Deleting permanently removes the driver and assignments. This
                cannot be undone.
              </span>
            </div>
          )}
        </Card>
      </div>

      <Card title="Add Driver">
        {createStatus ? (
          <div className="form-success">{createStatus}</div>
        ) : null}
        {createError ? <div className="form-error">{createError}</div> : null}
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Driver name</span>
            <input
              className="input"
              value={createForm.displayName}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  displayName: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Email</span>
            <input
              className="input"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Phone</span>
            <input
              className="input"
              value={createForm.phone}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  phone: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Employee ID</span>
            <input
              className="input"
              value={createForm.employeeId}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  employeeId: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">External reference</span>
            <input
              className="input"
              value={createForm.externalRef}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  externalRef: event.target.value,
                }))
              }
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Fleet</span>
            <select
              className="select"
              value={createForm.fleetId}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  fleetId: event.target.value,
                }))
              }
            >
              <option value="">Unassigned</option>
              {fleets.map((fleet) => (
                <option key={fleet.fleetId} value={fleet.fleetId}>
                  {fleet.name ?? fleet.fleetId}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Status</span>
            <select
              className="select"
              value={createForm.status}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field form__field--full">
            <span className="text-muted">Reason</span>
            <input
              className="input"
              value={createForm.reason}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  reason: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <div className="form__actions">
          <button className="btn" onClick={handleCreate}>
            Add driver
          </button>
        </div>
      </Card>
    </div>
  );
}
