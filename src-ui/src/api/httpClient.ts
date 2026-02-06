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
    token = session.tokens?.idToken?.toString();
    const accessPayload = session.tokens?.accessToken?.payload ?? {};
    role = getRoleFromGroups(
      accessPayload["cognito:groups"] ?? accessPayload.groups,
    );
  } catch (error) {
    console.warn("Auth session unavailable, continuing without token", error);
  }
  const baseUrl =
    options.baseUrl ?? import.meta.env.VITE_ONPOINT_BASE_URL ?? "";
  const apiKey = import.meta.env.VITE_ONPOINT_API_KEY;
  const roleOverride = import.meta.env.VITE_ONPOINT_ROLE_OVERRIDE;
  const resolvedRole = role ?? roleOverride;

  const response = await fetch(`${baseUrl}${path}`, {
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
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return (await response.json()) as T;
}
