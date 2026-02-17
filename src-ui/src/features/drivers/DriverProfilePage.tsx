import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "../../ui/Toast";
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

type DriverProfileForm = {
  displayName: string;
  email: string;
  phone: string;
  employeeId: string;
  externalRef: string;
  medicalCertExpiresAt: string;
  dqStatus: string;
  riskCategory: string;
  fleetId: string;
  customerId: string;
};

type FormFieldName = keyof DriverProfileForm;

type FormErrors = Partial<Record<FormFieldName, string>>;

export function DriverProfilePage() {
  const { driverId } = useParams();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
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

  const [form, setForm] = useState<DriverProfileForm>({
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
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<FormFieldName, boolean>>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const buildFormState = (driverData = driver): DriverProfileForm => ({
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

  const validateField = (
    field: FormFieldName,
    value: string,
  ): string | undefined => {
    const trimmed = value.trim();
    if (field === "displayName" && !trimmed) {
      return "Display name is required.";
    }
    if (field === "email" && trimmed) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return "Enter a valid email address.";
      }
    }
    if (field === "medicalCertExpiresAt" && trimmed) {
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoDateRegex.test(trimmed)) {
        return "Use YYYY-MM-DD format.";
      }
    }
    return undefined;
  };

  const validateForm = (value: DriverProfileForm): FormErrors => {
    const nextErrors: FormErrors = {};
    (Object.keys(value) as FormFieldName[]).forEach((field) => {
      const error = validateField(field, value[field]);
      if (error) nextErrors[field] = error;
    });
    return nextErrors;
  };

  useEffect(() => {
    if (!driver) return;
    setForm(buildFormState(driver));
    setErrors({});
    setTouched({});
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

  const handleBlur = (field: FormFieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, form[field]),
    }));
  };

  const isFormValid = useMemo(
    () => Object.keys(validateForm(form)).length === 0,
    [form],
  );

  const handleSave = async () => {
    if (!tenantId || !driverId) {
      addToast({
        type: "error",
        message: "Select a tenant and driver to continue.",
      });
      return;
    }

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setTouched({
      displayName: true,
      email: true,
      medicalCertExpiresAt: true,
    });
    if (Object.keys(nextErrors).length > 0) {
      addToast({
        type: "error",
        message: "Fix validation errors before saving.",
      });
      return;
    }

    setIsSaving(true);
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
      await queryClient.invalidateQueries({
        queryKey: queryKeys.driverDetail(tenantId, driverId),
      });
      await queryClient.invalidateQueries({ queryKey: ["drivers", tenantId] });
      addToast({ type: "success", message: "Driver updated successfully." });
    } catch (error) {
      addToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to update driver.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setForm(buildFormState(driver));
    setErrors({});
    setTouched({});
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
                <strong className="driver-profile__value">
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
                <strong className="driver-profile__value">
                  {formatDate(driver.createdAt)}
                </strong>
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
          <div className="form-grid">
            <div className="section form__field--full">
              <div className="section__title">Identity</div>
            </div>
            <label
              className="form__field"
              htmlFor="driver-profile-display-name"
            >
              <span className="text-muted">
                Display name <span className="required">*</span>
              </span>
              <input
                id="driver-profile-display-name"
                className="input driver-profile__input-value"
                value={form.displayName}
                onChange={(event) =>
                  handleChange("displayName", event.target.value)
                }
                onBlur={() => handleBlur("displayName")}
                aria-invalid={Boolean(
                  touched.displayName && errors.displayName,
                )}
                aria-describedby={
                  touched.displayName && errors.displayName
                    ? "driver-profile-display-name-error"
                    : undefined
                }
              />
              {touched.displayName && errors.displayName ? (
                <span
                  id="driver-profile-display-name-error"
                  className="form__error"
                >
                  {errors.displayName}
                </span>
              ) : null}
            </label>
            <label className="form__field" htmlFor="driver-profile-employee-id">
              <span className="text-muted">Employee ID</span>
              <input
                id="driver-profile-employee-id"
                className="input"
                value={form.employeeId}
                onChange={(event) =>
                  handleChange("employeeId", event.target.value)
                }
              />
            </label>
            <label
              className="form__field"
              htmlFor="driver-profile-external-ref"
            >
              <span className="text-muted">External ref</span>
              <input
                id="driver-profile-external-ref"
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
            <label className="form__field" htmlFor="driver-profile-email">
              <span className="text-muted">Email</span>
              <input
                id="driver-profile-email"
                className="input"
                value={form.email}
                onChange={(event) => handleChange("email", event.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={Boolean(touched.email && errors.email)}
                aria-describedby={
                  touched.email && errors.email
                    ? "driver-profile-email-error"
                    : undefined
                }
              />
              {touched.email && errors.email ? (
                <span id="driver-profile-email-error" className="form__error">
                  {errors.email}
                </span>
              ) : null}
            </label>
            <label className="form__field" htmlFor="driver-profile-phone">
              <span className="text-muted">Phone</span>
              <input
                id="driver-profile-phone"
                className="input"
                value={form.phone}
                onChange={(event) => handleChange("phone", event.target.value)}
              />
            </label>
            <div className="section form__field--full">
              <div className="section__title">Organization</div>
            </div>
            <label className="form__field" htmlFor="driver-profile-fleet-id">
              <span className="text-muted">Fleet ID</span>
              <input
                id="driver-profile-fleet-id"
                className="input"
                value={form.fleetId}
                onChange={(event) =>
                  handleChange("fleetId", event.target.value)
                }
              />
            </label>
            <label className="form__field" htmlFor="driver-profile-customer-id">
              <span className="text-muted">Customer ID</span>
              <input
                id="driver-profile-customer-id"
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
            <label
              className="form__field"
              htmlFor="driver-profile-medical-cert-expires"
            >
              <span className="text-muted">Medical cert expires</span>
              <input
                id="driver-profile-medical-cert-expires"
                className="input"
                value={form.medicalCertExpiresAt}
                onChange={(event) =>
                  handleChange("medicalCertExpiresAt", event.target.value)
                }
                onBlur={() => handleBlur("medicalCertExpiresAt")}
                aria-invalid={Boolean(
                  touched.medicalCertExpiresAt && errors.medicalCertExpiresAt,
                )}
                aria-describedby={
                  touched.medicalCertExpiresAt && errors.medicalCertExpiresAt
                    ? "driver-profile-medical-cert-expires-error"
                    : undefined
                }
                placeholder="YYYY-MM-DD"
              />
              {touched.medicalCertExpiresAt && errors.medicalCertExpiresAt ? (
                <span
                  id="driver-profile-medical-cert-expires-error"
                  className="form__error"
                >
                  {errors.medicalCertExpiresAt}
                </span>
              ) : null}
            </label>
            <label className="form__field" htmlFor="driver-profile-dq-status">
              <span className="text-muted">DQ status</span>
              <input
                id="driver-profile-dq-status"
                className="input"
                value={form.dqStatus}
                onChange={(event) =>
                  handleChange("dqStatus", event.target.value)
                }
              />
            </label>
            <label
              className="form__field"
              htmlFor="driver-profile-risk-category"
            >
              <span className="text-muted">Risk category</span>
              <input
                id="driver-profile-risk-category"
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
                disabled={!isDirty || isSaving || !isFormValid}
              >
                {isSaving ? (
                  <span className="btn__spinner" aria-hidden="true" />
                ) : null}
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
