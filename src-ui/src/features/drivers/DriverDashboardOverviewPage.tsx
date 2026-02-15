import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchDrivers } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";

export function DriverDashboardOverviewPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;
  const navigate = useNavigate();
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const { data: drivers = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId ?? "", fleetId),
    enabled: Boolean(tenantId),
  });

  const summary = useMemo(() => {
    const total = drivers.length;
    const active = drivers.filter(
      (driver) => String(driver.status ?? "").toUpperCase() === "ACTIVE",
    ).length;
    return { total, active };
  }, [drivers]);

  const handleDriverSelect = (value: string) => {
    setSelectedDriverId(value);
    if (value) {
      navigate(`/adlp/drivers/${value}/dashboard`);
    }
  };

  return (
    <div className="page driver-dashboard">
      <section className="insight-hero insight-hero--drivers">
        <div className="insight-hero__glow" />
        <div className="insight-hero__content">
          <div>
            <p className="insight-hero__eyebrow">Driver operations</p>
            <h1>Driver dashboard</h1>
            <p className="insight-hero__subtitle">
              Select a driver to review safety, efficiency, and risk signals in
              one timeline.
            </p>
          </div>
          <div className="insight-hero__meta">
            <div className="insight-chip">Total drivers: {summary.total}</div>
            <div className="insight-chip">Active drivers: {summary.active}</div>
            <div className="insight-chip">Fleet: {fleetId ?? "All fleets"}</div>
            <label className="form__field">
              <span className="text-muted">Select driver</span>
              <select
                className="select"
                value={selectedDriverId}
                onChange={(event) => handleDriverSelect(event.target.value)}
                disabled={!drivers.length}
              >
                <option value="">Choose driver</option>
                {drivers.map((driver) => (
                  <option key={driver.driverId} value={driver.driverId}>
                    {driver.name ?? driver.displayName ?? driver.driverId}
                  </option>
                ))}
              </select>
            </label>
            <Link className="btn" to="/adlp/drivers/summary">
              Go to driver directory
            </Link>
          </div>
        </div>
      </section>

      <div className="insight-grid">
        <Card title="Safety & efficiency overview">
          <div className="kpi-grid">
            <div className="kpi-card">
              <span>Total miles</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Driving time</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Night miles</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Average speed</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Safety score</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Fuel efficiency</span>
              <strong>--</strong>
            </div>
          </div>
        </Card>
        <Card title="How to use this view">
          <ul className="insight-list">
            <li>Pick a driver to load KPIs, trips, and event drilldowns.</li>
            <li>Use date ranges to compare weekly performance shifts.</li>
            <li>Click KPI tiles to jump to the related drilldown.</li>
          </ul>
          <div className="empty-state">
            Select a driver to load analytics, trips, and event drilldowns.
          </div>
        </Card>
      </div>
    </div>
  );
}
