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

function parseIsoToMs(value) {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : time;
}

function findCurrentAssignment(records) {
  const now = Date.now();
  const active = records.find((record) => {
    const from = parseIsoToMs(record.effectiveFrom);
    const to = parseIsoToMs(record.effectiveTo);
    if (from === undefined) return false;
    if (to === undefined) return from <= now;
    return from <= now && now <= to;
  });
  if (active) return active;
  return records
    .slice()
    .sort((a, b) =>
      String(b.effectiveFrom ?? "").localeCompare(
        String(a.effectiveFrom ?? ""),
      ),
    )[0];
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
  const [tenantIdArg, vin] = process.argv.slice(2);
  if (!tenantIdArg || !vin) {
    console.error(
      "Usage: node scripts/check_vin_assignment.js <tenantId|all> <vin>",
    );
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

  const baseHeaders = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "x-role": role,
  };

  const tenantId =
    tenantIdArg.toLowerCase() === "all" ? undefined : tenantIdArg;
  const tenantIds = [];

  if (!tenantId) {
    const response = await httpRequest(baseUrl, "/tenants", "GET", baseHeaders);
    const items = normalizeItems(response);
    for (const item of items) {
      if (item && typeof item === "object") {
        const id = item.tenantId ?? item.id;
        if (id) tenantIds.push(String(id));
      }
    }
    if (!tenantIds.length) {
      console.log("No tenants available to scan.");
      return;
    }
  } else {
    tenantIds.push(tenantId);
  }

  const matches = [];
  for (const tenant of tenantIds) {
    const headers = { ...baseHeaders, "x-tenant-id": tenant };
    try {
      const response = await httpRequest(
        baseUrl,
        `/vin-registry/${vin}`,
        "GET",
        headers,
      );
      const records = normalizeItems(response).map((item) => item ?? {});
      if (!records.length) continue;
      const current = findCurrentAssignment(records);
      if (!current) continue;
      matches.push({ tenant, current });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes("forbidden")) {
        console.error(`Failed for tenant ${tenant}:`, message);
      }
    }
  }

  if (!matches.length) {
    console.log(`No VIN registry records found for ${vin}.`);
    return;
  }

  for (const match of matches) {
    const fleetLabel = match.current.fleetId ?? "(no fleet)";
    console.log(
      `Current assignment for ${vin}: tenant=${match.current.tenantId ?? match.tenant}, fleet=${fleetLabel}`,
    );
  }
}

run().catch((error) => {
  console.error(
    "Check failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
