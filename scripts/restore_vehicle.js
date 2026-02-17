import fs from "fs";
import path from "path";

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const raw = fs.readFileSync(filePath, "utf8");
  const lines = raw.split(/\r?\n/);
  const entries = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries[key] = value;
  }
  return entries;
}

function resolveEnv() {
  const repoRoot = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
  );
  const envCandidates = [
    path.join(repoRoot, "src-ui", ".env"),
    path.join(repoRoot, ".env"),
  ];
  const merged = {};
  for (const envPath of envCandidates) {
    Object.assign(merged, parseEnvFile(envPath));
  }
  return merged;
}

async function httpRequest(baseUrl, pathName, method, headers, body) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Request failed (${response.status})`);
  }
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function run() {
  const [tenantId, vin] = process.argv.slice(2);
  if (!tenantId || !vin) {
    console.error("Usage: node scripts/restore_vehicle.js <tenantId> <vin>");
    process.exit(1);
  }

  const env = resolveEnv();
  const baseUrl =
    process.env.ONPOINT_PROXY_TARGET ||
    env.ONPOINT_PROXY_TARGET ||
    env.VITE_ONPOINT_BASE_URL;
  const apiKey = process.env.VITE_ONPOINT_API_KEY || env.VITE_ONPOINT_API_KEY;
  const role = process.env.ONPOINT_ROLE || "admin";

  if (!baseUrl) {
    console.error(
      "Missing ONPOINT_PROXY_TARGET or VITE_ONPOINT_BASE_URL in env.",
    );
    process.exit(1);
  }
  if (baseUrl.startsWith("/")) {
    console.error(
      "Base URL is relative. Set ONPOINT_PROXY_TARGET to the API base URL.",
    );
    process.exit(1);
  }
  if (!apiKey) {
    console.error("Missing VITE_ONPOINT_API_KEY in env.");
    process.exit(1);
  }

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "x-tenant-id": tenantId,
    "x-role": role,
  };

  await httpRequest(baseUrl, "/vehicles", "POST", headers, {
    vin,
    status: "ACTIVE",
    reason: "restore",
  });

  console.log(`Restored vehicle ${vin} for tenant ${tenantId}.`);
}

run().catch((error) => {
  console.error(
    "Restore failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
