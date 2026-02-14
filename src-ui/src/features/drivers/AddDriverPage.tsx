import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDriver } from "../../api/onpointApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { createIdempotencyKey } from "../../utils/id";

export function AddDriverPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    phone: "",
    employeeId: "",
    externalRef: "",
    status: "ACTIVE",
    reason: "New driver",
  });

  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id;

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!tenantId) {
      setError("Select a tenant to continue.");
      return;
    }
    if (!form.displayName.trim()) {
      setError("Driver name is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createDriver(
        {
          tenantId,
          fleetId,
          displayName: form.displayName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          employeeId: form.employeeId.trim() || undefined,
          externalRef: form.externalRef.trim() || undefined,
          status: form.status,
          reason: form.reason,
        },
        createIdempotencyKey(),
      );
      navigate("/adlp/drivers/summary");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create driver.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Add Driver"
        subtitle="Create a new driver profile for this tenant."
      />
      <Card title="Driver profile">
        {error ? <div className="form-error">{error}</div> : null}
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Driver name</span>
            <input
              className="input"
              value={form.displayName}
              onChange={(event) =>
                handleChange("displayName", event.target.value)
              }
              placeholder="Alex Driver"
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Email</span>
            <input
              className="input"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="driver@example.com"
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Phone</span>
            <input
              className="input"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              placeholder="+1-555-0100"
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
              placeholder="EMP-102"
            />
          </label>
          <label className="form__field">
            <span className="text-muted">External reference</span>
            <input
              className="input"
              value={form.externalRef}
              onChange={(event) =>
                handleChange("externalRef", event.target.value)
              }
              placeholder="HRIS-204"
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Status</span>
            <select
              className="select"
              value={form.status}
              onChange={(event) => handleChange("status", event.target.value)}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </label>
          <label className="form__field form__field--full">
            <span className="text-muted">Reason</span>
            <input
              className="input"
              value={form.reason}
              onChange={(event) => handleChange("reason", event.target.value)}
            />
          </label>
        </div>
        <div className="form__actions">
          <button
            className="btn"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Create driver"}
          </button>
        </div>
      </Card>
    </div>
  );
}
