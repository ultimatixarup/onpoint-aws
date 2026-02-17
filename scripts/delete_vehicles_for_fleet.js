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

function normalizeItems(response) {
  if (Array.isArray(response)) return response;
  if (
    response &&
    typeof response === "object" &&
    Array.isArray(response.items)
  ) {
    return response.items;
  }
  return [];
}

function extractVin(item) {
  if (!item || typeof item !== "object") return undefined;
  const record = item;
  const pkValue = record.PK;
  const vinFromPk =
    typeof pkValue === "string" && pkValue.startsWith("VEHICLE#")
      ? pkValue.split("VEHICLE#")[1]
      : undefined;
  return record.vin || record.VIN || record.id || vinFromPk;
}

async function httpRequest(baseUrl, pathName, method, headers) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method,
    headers,
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
  const args = process.argv.slice(2);
  const confirmFlag = args.includes("--confirm");
  const positional = args.filter((arg) => arg !== "--confirm");
  const [tenantId, fleetIdArg] = positional;
  if (!tenantId) {
    console.error(
      "Usage: node scripts/delete_vehicles_for_fleet.js <tenantId> [fleetId] [--confirm]",
    );
    process.exit(1);
  }
  const fleetId = fleetIdArg ?? "";

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
  if (fleetId) {
    headers["x-fleet-id"] = fleetId;
  }

  const query = new URLSearchParams({ tenantId });
  if (fleetId) query.set("fleetId", fleetId);
  const list = await httpRequest(
    baseUrl,
    `/vehicles?${query.toString()}`,
    "GET",
    headers,
  );
  const items = normalizeItems(list);
  const vins = items
    .map(extractVin)
    .filter(Boolean)
    .map((vin) => String(vin));
  const unique = Array.from(new Set(vins));

  if (!unique.length) {
    console.log("No vehicles found for the specified tenant and fleet.");
    return;
  }

  console.log(`Found ${unique.length} vehicle(s):`);
  unique.forEach((vin) => console.log(`- ${vin}`));

  if (!confirmFlag) {
    console.log("\nDry run only. Re-run with --confirm to delete.");
    return;
  }

  for (const vin of unique) {
    await httpRequest(
      baseUrl,
      `/vehicles/${encodeURIComponent(vin)}`,
      "DELETE",
      headers,
    );
    console.log(`Deleted ${vin}`);
  }
}

run().catch((error) => {
  console.error(
    "Delete failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
