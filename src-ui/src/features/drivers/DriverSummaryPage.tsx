import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  fetchAssignedDriverIdsByAssignments,
  fetchDrivers,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "attention", label: "Needs attention" },
  { key: "assigned", label: "Assigned" },
  { key: "unassigned", label: "Unassigned" },
  { key: "compliance", label: "Compliance alerts" },
  { key: "highRisk", label: "High risk" },
] as const;
type DriverFilter = (typeof FILTERS)[number]["key"];

function normalizeStatus(value?: string) {
  return (value ?? "unknown").toLowerCase();
}

function toBadgeClass(status?: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "active") return "badge badge--active";
  if (normalized === "inactive") return "badge badge--inactive";
  if (normalized === "suspended") return "badge badge--suspended";
  if (normalized === "deleted") return "badge badge--deleted";
  return "badge";
}

function isAssigned(
  driver: { driverId?: string | null; fleetId?: string | null },
  assignedDriverIds: Set<string>,
) {
  if (driver.driverId && assignedDriverIds.has(driver.driverId)) return true;
  return false;
}

const COMPLIANCE_WINDOW_DAYS = 30;

function parseDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const millis = value < 1e12 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

function getLicenseExpiry(license?: Record<string, unknown> | null) {
  if (!license) return undefined;
  const keys = [
    "expiresAt",
    "expirationDate",
    "expiryDate",
    "expires",
    "expiration",
    "expires_on",
    "expiry",
  ];
  for (const key of keys) {
    const value = license[key];
    const date = parseDate(value);
    if (date) return date;
  }
  return undefined;
}

function getComplianceFlags(driver: {
  dqStatus?: string | null;
  medicalCertExpiresAt?: string | null;
  license?: Record<string, unknown> | null;
}) {
  const issues: string[] = [];
  const status = String(driver.dqStatus ?? "").toLowerCase();
  if (
    status &&
    !["compliant", "clear", "pass", "passed", "active"].includes(status)
  ) {
    issues.push("DQ status");
  }

  const now = Date.now();
  const windowMs = COMPLIANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const licenseExpiry = getLicenseExpiry(driver.license ?? undefined);
  if (licenseExpiry) {
    const diff = licenseExpiry.getTime() - now;
    if (diff <= 0) issues.push("License expired");
    else if (diff <= windowMs) issues.push("License expiring");
  }

  const medicalExpiry = parseDate(driver.medicalCertExpiresAt);
  if (medicalExpiry) {
    const diff = medicalExpiry.getTime() - now;
    if (diff <= 0) issues.push("Medical cert expired");
    else if (diff <= windowMs) issues.push("Medical cert expiring");
  }

  return {
    hasAlert: issues.length > 0,
    issues,
  };
}

function isComplianceAlert(driver: {
  dqStatus?: string | null;
  medicalCertExpiresAt?: string | null;
  license?: Record<string, unknown> | null;
}) {
  return getComplianceFlags(driver).hasAlert;
}

function isHighRisk(driver: { riskCategory?: string | null }) {
  const risk = String(driver.riskCategory ?? "").toLowerCase();
  return ["high", "severe", "critical"].includes(risk);
}

export function DriverSummaryPage() {
  const [searchParams] = useSearchParams();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;
  const [search, setSearch] = useState("");
  const filterFromQuery = searchParams.get("filter");
  const initialFilter = useMemo<DriverFilter>(() => {
    const candidate = FILTERS.find((item) => item.key === filterFromQuery)?.key;
    return candidate ?? "all";
  }, [filterFromQuery]);
  const [filter, setFilter] = useState<DriverFilter>(initialFilter);

  const {
    data: drivers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId),
  });

  const { data: assignedDriverIds = [] } = useQuery({
    queryKey: ["assigned-driver-ids", tenantId ?? "none", fleetId ?? "all"],
    queryFn: () => fetchAssignedDriverIdsByAssignments(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId),
  });

  const assignedDriverSet = useMemo(
    () => new Set(assignedDriverIds),
    [assignedDriverIds],
  );

  const stats = useMemo(() => {
    const counts = {
      total: drivers.length,
      active: 0,
      inactive: 0,
      attention: 0,
      assigned: 0,
      unassigned: 0,
      compliance: 0,
      highRisk: 0,
    };
    drivers.forEach((driver) => {
      const status = normalizeStatus(driver.status);
      if (status === "active") counts.active += 1;
      else if (status === "inactive") counts.inactive += 1;
      else counts.attention += 1;
      if (isAssigned(driver, assignedDriverSet)) counts.assigned += 1;
      if (isComplianceAlert(driver)) counts.compliance += 1;
      if (isHighRisk(driver)) counts.highRisk += 1;
    });
    counts.unassigned = counts.total - counts.assigned;
    return counts;
  }, [assignedDriverSet, drivers]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      const status = normalizeStatus(driver.status);
      if (filter === "active" && status !== "active") return false;
      if (filter === "inactive" && status !== "inactive") return false;
      if (
        filter === "attention" &&
        (status === "active" || status === "inactive")
      ) {
        return false;
      }
      if (filter === "assigned" && !isAssigned(driver, assignedDriverSet)) {
        return false;
      }
      if (filter === "unassigned" && isAssigned(driver, assignedDriverSet)) {
        return false;
      }
      if (filter === "compliance" && !isComplianceAlert(driver)) return false;
      if (filter === "highRisk" && !isHighRisk(driver)) return false;
      if (!query) return true;
      return [
        driver.name,
        driver.displayName,
        driver.driverId,
        driver.email,
        driver.phone,
        driver.fleetId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [assignedDriverSet, drivers, search, filter]);

  return (
    <div className="page drivers-page">
      <section className="drivers-hero">
        <div className="drivers-hero__glow" />
        <div className="drivers-hero__content">
          <div>
            <p className="drivers-hero__eyebrow">Driver directory</p>
            <h1>Drivers</h1>
            <p className="drivers-hero__subtitle">
              Track roster health, engagement, and assignments across the fleet.
            </p>
          </div>
          <div className="drivers-hero__actions">
            <Link className="btn btn--secondary" to="/adlp/drivers/add">
              Add driver
            </Link>
            <Link className="btn btn--secondary" to="/adlp/drivers/assign">
              Assign driver
            </Link>
            <button className="btn" type="button" onClick={() => refetch()}>
              Refresh
            </button>
          </div>
        </div>
        <div className="drivers-stats">
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            <span>Total drivers</span>
            <strong>{stats.total}</strong>
            <span className="text-muted">Fleet roster</span>
          </button>
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("active")}
            aria-pressed={filter === "active"}
          >
            <span>Active</span>
            <strong>{stats.active}</strong>
            <span className="text-muted">Currently enabled</span>
          </button>
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("inactive")}
            aria-pressed={filter === "inactive"}
          >
            <span>Inactive</span>
            <strong>{stats.inactive}</strong>
            <span className="text-muted">Off duty</span>
          </button>
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("attention")}
            aria-pressed={filter === "attention"}
          >
            <span>Needs attention</span>
            <strong>{stats.attention}</strong>
            <span className="text-muted">Suspended or unknown</span>
          </button>
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("assigned")}
            aria-pressed={filter === "assigned"}
          >
            <span>Assigned</span>
            <strong>{stats.assigned}</strong>
            <span className="text-muted">Active vehicle assignments</span>
          </button>
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("unassigned")}
            aria-pressed={filter === "unassigned"}
          >
            <span>Unassigned</span>
            <strong>{stats.unassigned}</strong>
            <span className="text-muted">No active assignment</span>
          </button>
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("compliance")}
            aria-pressed={filter === "compliance"}
          >
            <span>Compliance alerts</span>
            <strong>{stats.compliance}</strong>
            <span className="text-muted">Action required</span>
          </button>
          <button
            type="button"
            className="driver-stat"
            onClick={() => setFilter("highRisk")}
            aria-pressed={filter === "highRisk"}
          >
            <span>High risk drivers</span>
            <strong>{stats.highRisk}</strong>
            <span className="text-muted">Risk category high</span>
          </button>
        </div>
      </section>

      <Card title="Filters">
        <div className="drivers-filters">
          <label className="form__field">
            <span className="text-muted">Search name, email, ID</span>
            <input
              className="input"
              placeholder="Search drivers"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <div className="drivers-filters__chips">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                className={`filter-chip${
                  filter === item.key ? " filter-chip--active" : ""
                }`}
                type="button"
                onClick={() => setFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title={`Drivers (${filteredDrivers.length})`}>
        {!tenantId ? (
          <div className="empty-state">
            <div className="empty-state__icon">Fleet</div>
            <h3>Select a tenant</h3>
            <p className="text-muted">Choose a tenant to view drivers.</p>
          </div>
        ) : isLoading ? (
          <div className="empty-state">
            <div className="empty-state__icon">Signal</div>
            <h3>Loading drivers</h3>
            <p className="text-muted">Fetching roster details.</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-state__icon">Alert</div>
            <h3>Unable to load drivers</h3>
            <p className="text-muted">Try refreshing the page.</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">Search</div>
            <h3>No matches</h3>
            <p className="text-muted">
              Adjust filters or search to find drivers.
            </p>
          </div>
        ) : (
          <div className="drivers-grid">
            {filteredDrivers.map((driver) => {
              const compliance = getComplianceFlags(driver);
              const highRisk = isHighRisk(driver);
              const assigned = isAssigned(driver, assignedDriverSet);
              return (
                <article key={driver.driverId} className="driver-card">
                  <div className="driver-card__header">
                    <div>
                      <div className="driver-card__name">
                        {driver.name ?? driver.displayName ?? "Unnamed driver"}
                      </div>
                      <div className="driver-card__id mono">
                        {driver.driverId}
                      </div>
                    </div>
                    <span className={toBadgeClass(driver.status)}>
                      {driver.status ?? "Unknown"}
                    </span>
                  </div>
                  <div className="driver-card__meta">
                    <div>
                      <span className="text-muted">Email</span>
                      <strong>{driver.email ?? "--"}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Phone</span>
                      <strong>{driver.phone ?? "--"}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Assignment</span>
                      <strong>{assigned ? "Assigned" : "Unassigned"}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Fleet ID</span>
                      <strong>{driver.fleetId ?? "--"}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Customer ID</span>
                      <strong>{driver.customerId ?? "--"}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Compliance</span>
                      <strong>{compliance.hasAlert ? "Alert" : "Clear"}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Risk</span>
                      <strong>{highRisk ? "High" : "Standard"}</strong>
                    </div>
                  </div>
                  <div className="driver-card__actions">
                    <Link
                      className="btn btn--secondary"
                      to={`/adlp/drivers/${driver.driverId}`}
                    >
                      Profile
                    </Link>
                    <Link
                      className="btn"
                      to={`/adlp/drivers/${driver.driverId}/dashboard`}
                    >
                      Dashboard
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
