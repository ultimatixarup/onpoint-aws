import { fetchAuthSession } from "aws-amplify/auth";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const GROUP_TO_ROLE: Record<string, string> = {
  platformadmin: "admin",
  tenantadmin: "tenant-admin",
  fleetmanager: "fleet-manager",
  dispatcher: "analyst",
  readonly: "read-only",
};

function getRoleFromGroups(groups: unknown): string | undefined {
  if (!groups) return undefined;
  const list = Array.isArray(groups)
    ? groups
    : typeof groups === "string"
      ? groups.split(",")
      : [];
  const normalized = list
    .map((group) => (typeof group === "string" ? group.toLowerCase() : ""))
    .map((group) => group.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

  for (const group of normalized) {
    const role = GROUP_TO_ROLE[group];
    if (role) return role;
  }
  return undefined;
}

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  baseUrl?: string;
};

export async function httpRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  let token: string | undefined;
  let role: string | undefined;
  try {
    const session = await fetchAuthSession();
    const accessToken = session.tokens?.accessToken?.toString();
    const idToken = session.tokens?.idToken?.toString();
    token = accessToken ?? idToken;
    const accessPayload = session.tokens?.accessToken?.payload ?? {};
    const idPayload = session.tokens?.idToken?.payload ?? {};
    role =
      getRoleFromGroups(
        accessPayload["cognito:groups"] ?? accessPayload.groups,
      ) ??
      getRoleFromGroups(idPayload["cognito:groups"] ?? idPayload.groups);
  } catch (error) {
    console.warn("Auth session unavailable, continuing without token", error);
  }
  const baseUrl =
    options.baseUrl ?? import.meta.env.VITE_ONPOINT_BASE_URL ?? "";
  const apiKey = import.meta.env.VITE_ONPOINT_API_KEY;
  const roleOverride = import.meta.env.VITE_ONPOINT_ROLE_OVERRIDE;
  const resolvedRole = role ?? roleOverride;

  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(apiKey ? { "x-api-key": apiKey } : {}),
      ...(resolvedRole ? { "x-role": resolvedRole } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const rawMessage = await response.text();
    let message = rawMessage;
    if (rawMessage) {
      try {
        const parsed = JSON.parse(rawMessage) as
          | { error?: unknown; message?: unknown }
          | string
          | number
          | boolean
          | null;
        if (typeof parsed === "string") {
          message = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
          if (parsed.error !== undefined) {
            message = String(parsed.error);
          } else if (parsed.message !== undefined) {
            message = String(parsed.message);
          }
        }
      } catch (error) {
        console.warn("Unable to parse error response", error);
      }
    }
    throw new Error(message || `Request failed (${response.status})`);
  }

  const raw = await response.text();
  if (!raw) {
    return null as T;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    const snippet = raw.length > 200 ? `${raw.slice(0, 200)}...` : raw;
    throw new Error(
      `Invalid JSON response from ${url} (status ${response.status}). ${snippet}`,
    );
  }
}
