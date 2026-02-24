import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  deleteScopeSetting,
  fetchEffectiveSettings,
  fetchScopeSettings,
  SettingValueType,
  SettingsScopeType,
  upsertScopeSetting,
} from "../../api/onpointApi";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

function formatSettingValue(value: unknown): string {
  if (value === null || value === undefined) return "--";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function parseSettingInput(
  valueType: SettingValueType,
  rawValue: string,
): unknown {
  if (valueType === "string") return rawValue;
  if (valueType === "number") {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      throw new Error("Value must be a valid number");
    }
    return parsed;
  }
  if (valueType === "boolean") {
    const normalized = rawValue.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
    throw new Error("Value must be true or false");
  }
  if (valueType === "null") return null;
  if (valueType === "array" || valueType === "object") {
    try {
      const parsed = JSON.parse(rawValue);
      if (valueType === "array" && !Array.isArray(parsed)) {
        throw new Error("Value must be a JSON array");
      }
      if (
        valueType === "object" &&
        (parsed === null || Array.isArray(parsed) || typeof parsed !== "object")
      ) {
        throw new Error("Value must be a JSON object");
      }
      return parsed;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Invalid JSON value");
    }
  }
  return rawValue;
}

function validateSettingKey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Setting key is required";
  if (trimmed.length < 2) return "Setting key is too short";
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return "Use letters, numbers, dot, underscore, or hyphen only";
  }
  return null;
}

function inferValueType(value: unknown): SettingValueType {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") return "string";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  return "string";
}

function toValueInput(value: unknown, type: SettingValueType): string {
  if (type === "null") return "";
  if (type === "object" || type === "array") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "";
    }
  }
  if (value === null || value === undefined) return "";
  return String(value);
}

export function ConfigurationPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id;
  const [scopeType, setScopeType] = useState<SettingsScopeType>("TENANT");
  const [settingKey, setSettingKey] = useState("");
  const [valueType, setValueType] = useState<SettingValueType>("string");
  const [valueInput, setValueInput] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["settings", "effective", tenantId, fleetId ?? "all"],
    queryFn: () => fetchEffectiveSettings(tenantId, fleetId),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
  });

  const scopeId = scopeType === "FLEET" ? (fleetId ?? "") : tenantId;

  const {
    data: scopeData,
    isLoading: isScopeLoading,
    error: scopeError,
  } = useQuery({
    queryKey: ["settings", "scope", scopeType, scopeId],
    queryFn: () =>
      fetchScopeSettings(scopeType, scopeId, {
        tenantId,
        ...(fleetId ? { fleetId } : {}),
      }),
    enabled: Boolean(scopeId),
    staleTime: 15_000,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!scopeId) {
        throw new Error(
          scopeType === "FLEET"
            ? "Select a fleet before saving fleet settings"
            : "Tenant context is required",
        );
      }
      const trimmedKey = settingKey.trim();
      if (!trimmedKey) {
        throw new Error("Setting key is required");
      }
      const parsedValue = parseSettingInput(valueType, valueInput);
      await upsertScopeSetting(
        scopeType,
        scopeId,
        trimmedKey,
        {
          value: parsedValue,
          valueType,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
        {
          tenantId,
          ...(fleetId ? { fleetId } : {}),
        },
      );
    },
    onSuccess: async () => {
      setLocalError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["settings", "effective", tenantId, fleetId ?? "all"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["settings", "scope", scopeType, scopeId],
        }),
      ]);
    },
    onError: (mutationError) => {
      setLocalError(
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to save setting",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetKey: string) => {
      if (!scopeId) {
        throw new Error("Scope is required");
      }
      await deleteScopeSetting(
        scopeType,
        scopeId,
        targetKey,
        reason.trim() ? { reason: reason.trim() } : undefined,
        {
          tenantId,
          ...(fleetId ? { fleetId } : {}),
        },
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["settings", "effective", tenantId, fleetId ?? "all"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["settings", "scope", scopeType, scopeId],
        }),
      ]);
    },
  });

  const rows = useMemo(
    () =>
      Object.entries(data?.effective ?? {})
        .map(([key, value]) => ({
          key,
          value,
          source: data?.sources?.[key],
        }))
        .sort((left, right) => left.key.localeCompare(right.key)),
    [data],
  );

  const keyError = useMemo(() => validateSettingKey(settingKey), [settingKey]);

  const valueValidationError = useMemo(() => {
    if (valueType === "null") return null;
    if (!valueInput.trim()) return "Value is required";
    try {
      parseSettingInput(valueType, valueInput);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "Invalid value";
    }
  }, [valueInput, valueType]);

  const canSave =
    !saveMutation.isPending &&
    Boolean(scopeId) &&
    !keyError &&
    !valueValidationError;

  const totalCount = rows.length;
  const tenantScopedCount = rows.filter(
    (row) => row.source?.scopeType === "TENANT",
  ).length;
  const fleetScopedCount = rows.filter(
    (row) => row.source?.scopeType === "FLEET",
  ).length;

  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Administration</p>
        <h1>Configuration</h1>
        <p className="ops-placeholder__subtitle">
          Define scoped settings here, then verify their resolved effective
          values below.
        </p>
      </section>

      <Card title="Set Configuration Value">
        <p className="text-muted" style={{ marginTop: 0 }}>
          Choose scope, provide key and typed value, then save. Tenant settings
          apply broadly; fleet settings override tenant values for that fleet.
        </p>
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Scope</span>
            <select
              className="select"
              value={scopeType}
              onChange={(event) =>
                setScopeType(event.target.value as SettingsScopeType)
              }
            >
              <option value="TENANT">Tenant ({tenantId || "--"})</option>
              <option value="FLEET" disabled={!fleetId}>
                Fleet ({fleetId || "select fleet first"})
              </option>
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Key</span>
            <input
              className="input"
              placeholder="example.maxIdleMinutes"
              value={settingKey}
              onChange={(event) => setSettingKey(event.target.value)}
              aria-invalid={Boolean(keyError)}
            />
            {keyError ? <span className="form__error">{keyError}</span> : null}
          </label>
          <label className="form__field">
            <span className="text-muted">Type</span>
            <select
              className="select"
              value={valueType}
              onChange={(event) =>
                setValueType(event.target.value as SettingValueType)
              }
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="object">object (JSON)</option>
              <option value="array">array (JSON)</option>
              <option value="null">null</option>
            </select>
          </label>
          <label className="form__field form__field--full">
            <span className="text-muted">Value</span>
            <textarea
              className="textarea"
              value={valueType === "null" ? "null" : valueInput}
              onChange={(event) => setValueInput(event.target.value)}
              disabled={valueType === "null"}
              aria-invalid={Boolean(valueValidationError)}
              placeholder={
                valueType === "object"
                  ? '{"threshold": 10}'
                  : valueType === "array"
                    ? '["a", "b"]'
                    : valueType === "boolean"
                      ? "true"
                      : valueType === "number"
                        ? "42"
                        : "value"
              }
            />
            {valueValidationError ? (
              <span className="form__error">{valueValidationError}</span>
            ) : (
              <span className="text-muted">
                {valueType === "object" || valueType === "array"
                  ? "Enter valid JSON for this type"
                  : ""}
              </span>
            )}
          </label>
          <label className="form__field form__field--full">
            <span className="text-muted">Reason (optional)</span>
            <input
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why this setting changed"
            />
          </label>
        </div>
        <div className="form__actions">
          <button
            className="btn btn--secondary"
            onClick={() => {
              setSettingKey("");
              setValueInput("");
              setReason("");
              setLocalError(null);
            }}
            disabled={saveMutation.isPending}
          >
            Clear
          </button>
          <button
            className="btn"
            onClick={() => {
              setLocalError(null);
              saveMutation.mutate();
            }}
            disabled={!canSave}
          >
            {saveMutation.isPending ? "Saving..." : "Save setting"}
          </button>
        </div>
        {localError ? (
          <div className="banner banner--warning">{localError}</div>
        ) : null}
        {saveMutation.isSuccess ? (
          <p className="text-muted">Setting saved successfully.</p>
        ) : null}
      </Card>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <span>Total effective settings</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="dashboard-stat">
          <span>Tenant overrides</span>
          <strong>{tenantScopedCount}</strong>
        </div>
        <div className="dashboard-stat">
          <span>Fleet overrides</span>
          <strong>{fleetScopedCount}</strong>
        </div>
      </div>

      <Card title="Effective Settings">
        {isLoading ? <p>Loading settings...</p> : null}
        {error ? (
          <div className="banner banner--warning">
            Failed to load settings:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : null}
        {!isLoading && !error && rows.length === 0 ? (
          <p className="text-muted">
            No settings found for this scope. Defaults may still apply at
            runtime.
          </p>
        ) : null}
        {!isLoading && !error && rows.length > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td className="mono">{row.key}</td>
                    <td className="mono">{formatSettingValue(row.value)}</td>
                    <td>
                      {row.source?.scopeType ?? "--"}
                      {row.source?.scopeId ? ` (${row.source.scopeId})` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Card title="Current Scope Settings">
        {isScopeLoading ? <p>Loading scope settings...</p> : null}
        {scopeError ? (
          <div className="banner banner--warning">
            Failed to load scope settings:{" "}
            {scopeError instanceof Error ? scopeError.message : "Unknown error"}
          </div>
        ) : null}
        {!isScopeLoading &&
        !scopeError &&
        (scopeData?.items?.length ?? 0) === 0 ? (
          <p className="text-muted">No settings defined yet for this scope.</p>
        ) : null}
        {!isScopeLoading &&
        !scopeError &&
        (scopeData?.items?.length ?? 0) > 0 ? (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Type</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scopeData?.items?.map((item) => (
                  <tr key={item.key}>
                    <td className="mono">{item.key}</td>
                    <td className="mono">{formatSettingValue(item.value)}</td>
                    <td>{item.valueType ?? "--"}</td>
                    <td>{item.updatedAt ?? "--"}</td>
                    <td>
                      <div className="inline">
                        <button
                          className="btn btn--secondary"
                          onClick={() => {
                            const resolvedType =
                              (item.valueType as
                                | SettingValueType
                                | undefined) ?? inferValueType(item.value);
                            setSettingKey(item.key);
                            setValueType(resolvedType);
                            setValueInput(
                              toValueInput(item.value, resolvedType),
                            );
                            setLocalError(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn--secondary"
                          onClick={() => {
                            const confirmed = window.confirm(
                              `Delete setting \"${item.key}\" from ${scopeType} scope?`,
                            );
                            if (!confirmed) return;
                            deleteMutation.mutate(item.key);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {deleteMutation.isError ? (
          <div className="banner banner--warning">
            Failed to delete setting:{" "}
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : "Unknown error"}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
