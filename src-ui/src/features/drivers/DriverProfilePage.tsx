import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  DriverAssignment,
  fetchDriverAssignments,
  fetchDriverDetail,
  updateDriver,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { formatDate } from "../../utils/date";

function assignmentStatus(assignment: DriverAssignment) {
  if (!assignment.effectiveFrom && !assignment.effectiveTo) return "Unknown";
  const now = new Date();
  const from = assignment.effectiveFrom
    ? new Date(assignment.effectiveFrom)
    : undefined;
  const to = assignment.effectiveTo
    ? new Date(assignment.effectiveTo)
    : undefined;
  if (from && now < from) return "Upcoming";
  if (to && now > to) return "Ended";
  return "Active";
}

function normalizeText(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function statusBadgeClass(status?: string | null) {
  const normalized = normalizeText(status);
  if (normalized === "active") return "badge badge--active";
  if (normalized === "inactive") return "badge badge--inactive";
  if (normalized === "suspended") return "badge badge--suspended";
  if (normalized === "deleted") return "badge badge--deleted";
  return "badge";
}

function riskBadgeClass(risk?: string | null) {
  const normalized = normalizeText(risk);
  if (["high", "severe", "critical"].includes(normalized)) {
    return "badge badge--suspended";
  }
  if (["medium", "moderate"].includes(normalized)) return "badge";
  if (["low", "minimal"].includes(normalized)) return "badge badge--active";
  return "badge";
}

function dqBadgeClass(status?: string | null) {
  const normalized = normalizeText(status);
  if (["compliant", "clear", "pass", "passed", "active"].includes(normalized)) {
    return "badge badge--active";
  }
  if (["expired", "failed", "non-compliant"].includes(normalized)) {
    return "badge badge--suspended";
  }
  return "badge";
}

function displayValue(value?: string | null, fallback = "--") {
  return value && String(value).trim() ? value : fallback;
}

export function DriverProfilePage() {
  const { driverId } = useParams();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;

  const {
    data: driver,
    isLoading: isLoadingDriver,
    error: driverError,
  } = useQuery({
    queryKey:
      tenantId && driverId
        ? queryKeys.driverDetail(tenantId, driverId)
        : ["driver", "none"],
    queryFn: () => fetchDriverDetail(tenantId ?? "", driverId ?? ""),
    enabled: Boolean(tenantId && driverId),
  });

  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError,
  } = useQuery({
    queryKey: driverId
      ? queryKeys.driverAssignments(driverId)
      : ["driver-assignments", "none"],
    queryFn: () => fetchDriverAssignments(tenantId ?? "", driverId ?? ""),
    enabled: Boolean(tenantId && driverId),
  });

  const assignmentSummary = useMemo(() => {
    const summary = {
      total: assignments.length,
      active: 0,
      upcoming: 0,
      ended: 0,
    };
    assignments.forEach((assignment) => {
      const status = assignmentStatus(assignment);
      if (status === "Active") summary.active += 1;
      if (status === "Upcoming") summary.upcoming += 1;
      if (status === "Ended") summary.ended += 1;
    });
    return summary;
  }, [assignments]);

  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    employeeId: "",
    externalRef: "",
    medicalCertExpiresAt: "",
    dqStatus: "",
    riskCategory: "",
    fleetId: "",
    customerId: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const buildFormState = (driverData = driver) => ({
    displayName: driverData?.displayName ?? driverData?.name ?? "",
    email: driverData?.email ?? "",
    phone: driverData?.phone ?? "",
    employeeId: driverData?.employeeId ?? "",
    externalRef: driverData?.externalRef ?? "",
    medicalCertExpiresAt: driverData?.medicalCertExpiresAt ?? "",
    dqStatus: driverData?.dqStatus ?? "",
    riskCategory: driverData?.riskCategory ?? "",
    fleetId: driverData?.fleetId ?? fleetId ?? "",
    customerId: driverData?.customerId ?? "",
  });

  useEffect(() => {
    if (!driver) return;
    setForm(buildFormState(driver));
  }, [driver, fleetId]);

  const isDirty = useMemo(() => {
    if (!driver) return false;
    return (
      (driver.displayName ?? driver.name ?? "") !== form.displayName ||
      (driver.email ?? "") !== form.email ||
      (driver.phone ?? "") !== form.phone ||
      (driver.employeeId ?? "") !== form.employeeId ||
      (driver.externalRef ?? "") !== form.externalRef ||
      (driver.medicalCertExpiresAt ?? "") !== form.medicalCertExpiresAt ||
      (driver.dqStatus ?? "") !== form.dqStatus ||
      (driver.riskCategory ?? "") !== form.riskCategory ||
      (driver.fleetId ?? fleetId ?? "") !== form.fleetId ||
      (driver.customerId ?? "") !== form.customerId
    );
  }, [driver, form, fleetId]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!tenantId || !driverId) {
      setErrorMessage("Select a tenant and driver to continue.");
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await updateDriver(tenantId, driverId, {
        displayName: form.displayName.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        employeeId: form.employeeId.trim() || undefined,
        externalRef: form.externalRef.trim() || undefined,
        medicalCertExpiresAt: form.medicalCertExpiresAt.trim() || undefined,
        dqStatus: form.dqStatus.trim() || undefined,
        riskCategory: form.riskCategory.trim() || undefined,
        fleetId: form.fleetId.trim() || undefined,
        customerId: form.customerId.trim() || undefined,
        reason: "Update driver profile",
      });
      setSuccessMessage("Driver updated.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update driver.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(buildFormState(driver));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (!driverId) {
    return (
      <div className="page">
        <PageHeader
          title="Driver profile"
          subtitle="Select a driver from the roster."
        />
      </div>
    );
  }

  return (
    <div className="page driver-profile">
      <div className="driver-profile__header">
        <div className="driver-profile__header-row">
          <PageHeader
            title={driver?.displayName ?? driver?.name ?? "Driver profile"}
            subtitle={driver?.driverId ? `ID: ${driver.driverId}` : undefined}
          />
          <div className="driver-profile__actions driver-profile__actions--grouped">
            <Link
              className="btn btn--secondary"
              to={`/adlp/drivers/${driverId}/dashboard`}
            >
              View dashboard
            </Link>
            <Link
              className="btn"
              to={`/adlp/drivers/assign?driverId=${driverId}`}
            >
              Assign driver
            </Link>
          </div>
        </div>
        <div className="driver-profile__meta">
          <span className={statusBadgeClass(driver?.status)}>
            {displayValue(driver?.status, "Unknown")}
          </span>
          <span className={riskBadgeClass(driver?.riskCategory)}>
            Risk: {displayValue(driver?.riskCategory, "--")}
          </span>
          <span className={dqBadgeClass(driver?.dqStatus)}>
            DQ: {displayValue(driver?.dqStatus, "--")}
          </span>
          <span className="driver-profile__chip mono">
            ID: {displayValue(driver?.driverId, "--")}
          </span>
          <span className="driver-profile__chip">
            Assignments: {assignmentSummary.total}
          </span>
          <span className="driver-profile__chip">
            Active: {assignmentSummary.active}
          </span>
          <span className="text-muted">
            Updated: {formatDate(driver?.updatedAt, "--")}
          </span>
        </div>
      </div>

      <div className="driver-profile__grid">
        <Card title="Profile overview">
          {isLoadingDriver ? (
            <div className="empty-state">Loading driver details...</div>
          ) : driverError ? (
            <div className="empty-state">Unable to load driver.</div>
          ) : driver ? (
            <div className="detail-grid">
              <div>
                <span className="text-muted">Email</span>
                <strong>
                  {driver.email ? (
                    <a className="link" href={`mailto:${driver.email}`}>
                      {driver.email}
                    </a>
                  ) : (
                    "--"
                  )}
                </strong>
              </div>
              <div>
                <span className="text-muted">Phone</span>
                <strong>
                  {driver.phone ? (
                    <a className="link" href={`tel:${driver.phone}`}>
                      {driver.phone}
                    </a>
                  ) : (
                    "--"
                  )}
                </strong>
              </div>
              <div>
                <span className="text-muted">Fleet</span>
                <strong className="mono">
                  {driver.fleetId ?? fleetId ?? "--"}
                </strong>
              </div>
              <div>
                <span className="text-muted">Customer</span>
                <strong className="mono">{driver.customerId ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">Status</span>
                <strong>
                  <span className={statusBadgeClass(driver.status)}>
                    {driver.status ?? "Unknown"}
                  </span>
                </strong>
              </div>
              <div>
                <span className="text-muted">Created</span>
                <strong>{formatDate(driver.createdAt)}</strong>
              </div>
              <div>
                <span className="text-muted">Updated</span>
                <strong>{formatDate(driver.updatedAt)}</strong>
              </div>
              <div>
                <span className="text-muted">Risk</span>
                <strong>
                  <span className={riskBadgeClass(driver.riskCategory)}>
                    {displayValue(driver.riskCategory, "--")}
                  </span>
                </strong>
              </div>
              <div>
                <span className="text-muted">DQ status</span>
                <strong>
                  <span className={dqBadgeClass(driver.dqStatus)}>
                    {displayValue(driver.dqStatus, "--")}
                  </span>
                </strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">Driver not found.</div>
          )}
        </Card>

        <Card title="Edit driver">
          {errorMessage ? (
            <div className="form-error">{errorMessage}</div>
          ) : null}
          {successMessage ? (
            <div className="form-success">{successMessage}</div>
          ) : null}
          <div className="form-grid">
            <div className="section form__field--full">
              <div className="section__title">Identity</div>
            </div>
            <label className="form__field">
              <span className="text-muted">Display name</span>
              <input
                className="input"
                value={form.displayName}
                onChange={(event) =>
                  handleChange("displayName", event.target.value)
                }
              />
            </label>
            <label className="form__field">
              <span className="text-muted">Employee ID</span>
              <input
                className="input"
                value={form.employeeId}
                onChange={(event) =>
                  handleChange("employeeId", event.target.value)
                }
              />
            </label>
            <label className="form__field">
              <span className="text-muted">External ref</span>
              <input
                className="input"
                value={form.externalRef}
                onChange={(event) =>
                  handleChange("externalRef", event.target.value)
                }
              />
            </label>
            <div className="section form__field--full">
              <div className="section__title">Contact</div>
            </div>
            <label className="form__field">
              <span className="text-muted">Email</span>
              <input
                className="input"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
              />
            </label>
            <label className="form__field">
              <span className="text-muted">Phone</span>
              <input
                className="input"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
            </label>
            <div className="section form__field--full">
              <div className="section__title">Organization</div>
            </div>
            <label className="form__field">
              <span className="text-muted">Fleet ID</span>
              <input
                className="input"
                value={form.fleetId}
                onChange={(event) =>
                  handleChange("fleetId", event.target.value)
                }
              />
            </label>
            <label className="form__field">
              <span className="text-muted">Customer ID</span>
              <input
                className="input"
                value={form.customerId}
                onChange={(event) =>
                  handleChange("customerId", event.target.value)
                }
              />
            </label>
            <div className="section form__field--full">
              <div className="section__title">Compliance</div>
            </div>
            <label className="form__field">
              <span className="text-muted">Medical cert expires</span>
              <input
                className="input"
                value={form.medicalCertExpiresAt}
                onChange={(event) =>
                  handleChange("medicalCertExpiresAt", event.target.value)
                }
                placeholder="YYYY-MM-DD"
              />
            </label>
            <label className="form__field">
              <span className="text-muted">DQ status</span>
              <input
                className="input"
                value={form.dqStatus}
                onChange={(event) =>
                  handleChange("dqStatus", event.target.value)
                }
              />
            </label>
            <label className="form__field">
              <span className="text-muted">Risk category</span>
              <input
                className="input"
                value={form.riskCategory}
                onChange={(event) =>
                  handleChange("riskCategory", event.target.value)
                }
              />
            </label>
          </div>
          <div className="form__actions form__actions--split">
            <span className="text-muted">
              {isDirty ? "Unsaved changes" : "All changes saved"}
            </span>
            <div className="inline">
              <button
                className="btn btn--secondary"
                type="button"
                onClick={handleReset}
                disabled={!isDirty || isSaving}
              >
                Reset
              </button>
              <button
                className="btn"
                type="button"
                onClick={handleSave}
                disabled={!isDirty || isSaving}
              >
                {isSaving ? "Saving..." : "Update driver"}
              </button>
            </div>
          </div>
        </Card>

        <Card title="Compliance & credentials">
          {driver ? (
            <div className="detail-grid">
              <div>
                <span className="text-muted">Employee ID</span>
                <strong>{driver.employeeId ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">External ref</span>
                <strong>{driver.externalRef ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">License</span>
                <strong>{driver.license ? "On file" : "--"}</strong>
              </div>
              <div>
                <span className="text-muted">Medical cert expires</span>
                <strong>{formatDate(driver.medicalCertExpiresAt)}</strong>
              </div>
              <div>
                <span className="text-muted">Risk category</span>
                <strong>{driver.riskCategory ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">DQ status</span>
                <strong>{driver.dqStatus ?? "--"}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">No compliance data.</div>
          )}
        </Card>
      </div>

      <Card title="Assignments">
        <div className="assignment-summary">
          <span className="assignment-chip">
            Total: {assignmentSummary.total}
          </span>
          <span className="assignment-chip">
            Active: {assignmentSummary.active}
          </span>
          <span className="assignment-chip">
            Upcoming: {assignmentSummary.upcoming}
          </span>
          <span className="assignment-chip">
            Ended: {assignmentSummary.ended}
          </span>
        </div>
        {isLoadingAssignments ? (
          <div className="empty-state">Loading assignments...</div>
        ) : assignmentsError ? (
          <div className="empty-state">Unable to load assignments.</div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">No assignments yet.</div>
        ) : (
          <div className="assignment-list">
            {assignments.map((assignment, index) => (
              <div
                key={`${assignment.vin}-${index}`}
                className="assignment-row"
              >
                <div>
                  <strong>{assignment.vin}</strong>
                  <div className="text-muted">
                    {assignment.assignmentType ?? "PRIMARY"}
                  </div>
                </div>
                <div>
                  <div className="text-muted">Effective</div>
                  <div>
                    {formatDate(assignment.effectiveFrom)} -
                    {formatDate(assignment.effectiveTo, "Present")}
                  </div>
                </div>
                <div className="assignment-row__status">
                  {assignmentStatus(assignment)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
