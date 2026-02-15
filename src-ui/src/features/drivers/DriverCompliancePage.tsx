import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchDrivers } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

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

function getExpiryState(date?: Date) {
  if (!date) {
    return { isExpired: false, isExpiring: false };
  }
  const now = Date.now();
  const diff = date.getTime() - now;
  if (diff <= 0) return { isExpired: true, isExpiring: false };
  if (diff <= COMPLIANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    return { isExpired: false, isExpiring: true };
  }
  return { isExpired: false, isExpiring: false };
}

function getComplianceFlags(driver: {
  dqStatus?: string | null;
  medicalCertExpiresAt?: string | null;
  license?: Record<string, unknown> | null;
}) {
  const issues: string[] = [];
  const status = String(driver.dqStatus ?? "").toLowerCase();
  const dqAlert =
    Boolean(status) &&
    !["compliant", "clear", "pass", "passed", "active"].includes(status);
  if (dqAlert) issues.push("DQ status");

  const licenseExpiry = getLicenseExpiry(driver.license ?? undefined);
  const licenseState = getExpiryState(licenseExpiry);
  if (licenseState.isExpired) issues.push("License expired");
  else if (licenseState.isExpiring) issues.push("License expiring");

  const medicalExpiry = parseDate(driver.medicalCertExpiresAt);
  const medicalState = getExpiryState(medicalExpiry);
  if (medicalState.isExpired) issues.push("Medical cert expired");
  else if (medicalState.isExpiring) issues.push("Medical cert expiring");

  return {
    issues,
    dqAlert,
    licenseState,
    medicalState,
  };
}

export function DriverCompliancePage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;

  const {
    data: drivers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId && fleetId),
  });

  const complianceData = useMemo(() => {
    return drivers.map((driver) => {
      const flags = getComplianceFlags(driver);
      return {
        driver,
        issues: flags.issues,
        dqAlert: flags.dqAlert,
        expired: flags.licenseState.isExpired || flags.medicalState.isExpired,
        expiring:
          flags.licenseState.isExpiring || flags.medicalState.isExpiring,
      };
    });
  }, [drivers]);

  const summary = useMemo(() => {
    const counts = {
      total: drivers.length,
      alerts: 0,
      expired: 0,
      expiring: 0,
      dqAlerts: 0,
    };
    complianceData.forEach((item) => {
      if (item.issues.length) counts.alerts += 1;
      if (item.expired) counts.expired += 1;
      if (item.expiring) counts.expiring += 1;
      if (item.dqAlert) counts.dqAlerts += 1;
    });
    return counts;
  }, [complianceData, drivers.length]);

  const alertDrivers = complianceData.filter((item) => item.issues.length > 0);

  return (
    <div className="page">
      <section className="insight-hero insight-hero--compliance">
        <div className="insight-hero__glow" />
        <div className="insight-hero__content">
          <div>
            <p className="insight-hero__eyebrow">Compliance</p>
            <h1>Driver compliance</h1>
            <p className="insight-hero__subtitle">
              Track license, medical, and DQ status health across the fleet.
            </p>
          </div>
          <div className="insight-hero__meta">
            <div className="insight-chip">Total drivers: {summary.total}</div>
            <div className="insight-chip">Alerts: {summary.alerts}</div>
            <div className="insight-chip">Expired: {summary.expired}</div>
            <div className="insight-chip">
              Expiring soon: {summary.expiring}
            </div>
            <div className="insight-chip">DQ alerts: {summary.dqAlerts}</div>
          </div>
        </div>
      </section>

      <div className="insight-grid">
        <Card title="Compliance overview">
          {!tenantId ? (
            <div className="empty-state">
              Select a tenant to view compliance.
            </div>
          ) : !fleetId ? (
            <div className="empty-state">
              Select a fleet to view compliance.
            </div>
          ) : isLoading ? (
            <div className="empty-state">Loading compliance data...</div>
          ) : error ? (
            <div className="empty-state">Unable to load compliance data.</div>
          ) : (
            <div className="kpi-grid">
              <div className="kpi-card">
                <span>Total drivers</span>
                <strong>{summary.total}</strong>
              </div>
              <div className="kpi-card">
                <span>Compliance alerts</span>
                <strong>{summary.alerts}</strong>
              </div>
              <div className="kpi-card">
                <span>Expired credentials</span>
                <strong>{summary.expired}</strong>
              </div>
              <div className="kpi-card">
                <span>Expiring soon</span>
                <strong>{summary.expiring}</strong>
              </div>
              <div className="kpi-card">
                <span>DQ alerts</span>
                <strong>{summary.dqAlerts}</strong>
              </div>
            </div>
          )}
        </Card>
        <Card title={`Compliance alerts (${alertDrivers.length})`}>
          {!tenantId || !fleetId ? (
            <div className="empty-state">Select a tenant and fleet.</div>
          ) : isLoading ? (
            <div className="empty-state">Loading alerts...</div>
          ) : alertDrivers.length === 0 ? (
            <div className="empty-state">No compliance alerts.</div>
          ) : (
            <div className="table-list">
              {alertDrivers.map((item) => (
                <div key={item.driver.driverId} className="table-row">
                  <div>
                    <strong>
                      {item.driver.name ??
                        item.driver.displayName ??
                        "Unnamed driver"}
                    </strong>
                    <div className="text-muted mono">
                      {item.driver.driverId}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Issues</span>
                    <div>{item.issues.join(" · ")}</div>
                  </div>
                  <div>
                    <span className="text-muted">Fleet</span>
                    <div>{item.driver.fleetId ?? "--"}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Compliance checklist">
          <ul className="insight-list">
            <li>License expiration tracking</li>
            <li>Medical certificate tracking</li>
            <li>DQ status review cadence</li>
            <li>
              DVIR logs available in the
              <Link className="link" to="/adlp/trips/dvir">
                {" "}
                DVIR view
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
