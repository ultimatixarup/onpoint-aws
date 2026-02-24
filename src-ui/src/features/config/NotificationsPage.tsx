import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  fetchEffectiveSettings,
  upsertScopeSetting,
} from "../../api/onpointApi";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

type NotificationFormState = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  webhookEnabled: boolean;
  emailRecipients: string;
};

const DEFAULT_STATE: NotificationFormState = {
  emailEnabled: true,
  smsEnabled: false,
  webhookEnabled: false,
  emailRecipients: "",
};

export function NotificationsPage() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id ?? "";
  const [form, setForm] = useState<NotificationFormState>(DEFAULT_STATE);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", "effective", tenantId, "notifications"],
    queryFn: () => fetchEffectiveSettings(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!data?.effective) return;
    setForm({
      emailEnabled:
        Boolean(data.effective["notifications.email.enabled"]) ||
        data.effective["notifications.email.enabled"] === undefined,
      smsEnabled: Boolean(data.effective["notifications.sms.enabled"]),
      webhookEnabled: Boolean(data.effective["notifications.webhook.enabled"]),
      emailRecipients:
        typeof data.effective["notifications.email.recipients"] === "string"
          ? String(data.effective["notifications.email.recipients"])
          : "",
    });
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!tenantId) throw new Error("Tenant is required");
      await Promise.all([
        upsertScopeSetting(
          "TENANT",
          tenantId,
          "notifications.email.enabled",
          {
            value: form.emailEnabled,
            valueType: "boolean",
            reason: "Updated from Notifications page",
          },
          { tenantId },
        ),
        upsertScopeSetting(
          "TENANT",
          tenantId,
          "notifications.sms.enabled",
          {
            value: form.smsEnabled,
            valueType: "boolean",
            reason: "Updated from Notifications page",
          },
          { tenantId },
        ),
        upsertScopeSetting(
          "TENANT",
          tenantId,
          "notifications.webhook.enabled",
          {
            value: form.webhookEnabled,
            valueType: "boolean",
            reason: "Updated from Notifications page",
          },
          { tenantId },
        ),
        upsertScopeSetting(
          "TENANT",
          tenantId,
          "notifications.email.recipients",
          {
            value: form.emailRecipients.trim(),
            valueType: "string",
            reason: "Updated from Notifications page",
          },
          { tenantId },
        ),
      ]);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["settings", "effective", tenantId],
      });
    },
  });

  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Notifications</p>
        <h1>Notifications</h1>
        <p className="ops-placeholder__subtitle">
          Configure alert delivery channels for this tenant.
        </p>
      </section>

      <Card title="Notification Preferences">
        {isLoading ? <p>Loading current notification settings...</p> : null}
        {error ? (
          <div className="banner banner--warning">
            Failed to load notification settings:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : null}

        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Email alerts</span>
            <select
              className="select"
              value={form.emailEnabled ? "enabled" : "disabled"}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  emailEnabled: event.target.value === "enabled",
                }))
              }
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <label className="form__field">
            <span className="text-muted">SMS alerts</span>
            <select
              className="select"
              value={form.smsEnabled ? "enabled" : "disabled"}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  smsEnabled: event.target.value === "enabled",
                }))
              }
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <label className="form__field">
            <span className="text-muted">Webhook alerts</span>
            <select
              className="select"
              value={form.webhookEnabled ? "enabled" : "disabled"}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  webhookEnabled: event.target.value === "enabled",
                }))
              }
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>

          <label className="form__field form__field--full">
            <span className="text-muted">Email recipients</span>
            <input
              className="input"
              value={form.emailRecipients}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  emailRecipients: event.target.value,
                }))
              }
              placeholder="ops@example.com, manager@example.com"
            />
          </label>
        </div>

        <div className="form__actions">
          <button
            className="btn"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !tenantId}
          >
            {mutation.isPending ? "Saving..." : "Save notification settings"}
          </button>
        </div>

        {mutation.isError ? (
          <div className="banner banner--warning" style={{ marginTop: "12px" }}>
            Failed to save:{" "}
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Unknown error"}
          </div>
        ) : null}
        {mutation.isSuccess ? (
          <p className="text-muted" style={{ marginTop: "12px" }}>
            Notification settings saved.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
