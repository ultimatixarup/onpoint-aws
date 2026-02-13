import { useMemo } from "react";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { useGeofenceStore } from "./geofenceStore";

export function GeofenceReportPage() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id ?? "";
  const { geofences, stats } = useGeofenceStore(tenantId);

  const typeRows = useMemo(
    () =>
      Object.entries(stats.byType).map(([type, count]) => ({ type, count })),
    [stats.byType],
  );

  return (
    <div className="page geofence-page">
      <section className="geofence-hero geofence-hero--report">
        <div className="geofence-hero__glow" />
        <div className="geofence-hero__content">
          <div>
            <p className="geofence-hero__eyebrow">Analytics</p>
            <h1>Geofence Report</h1>
            <p className="geofence-hero__subtitle">
              Summary of configured geofences and zone coverage.
            </p>
          </div>
        </div>
      </section>
      <Card title="Overview">
        {!tenantId ? (
          <p>Select a tenant to view report data.</p>
        ) : geofences.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">📊</div>
            <strong>No geofences yet</strong>
            <span className="text-muted">
              Create geofences to generate report metrics.
            </span>
          </div>
        ) : (
          <div className="stack">
            <div className="detail-grid">
              <div className="stat">
                <p className="stat__label">Total</p>
                <p className="stat__value">{stats.total}</p>
              </div>
              <div className="stat">
                <p className="stat__label">Active</p>
                <p className="stat__value">{stats.active}</p>
              </div>
              <div className="stat">
                <p className="stat__label">Inactive</p>
                <p className="stat__value">{stats.inactive}</p>
              </div>
            </div>

            <div className="section">
              <div className="section__title">By Type</div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeRows.map((row) => (
                      <tr key={row.type}>
                        <td>{row.type}</td>
                        <td>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="section">
              <div className="section__title">Geofence Details</div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Fleet</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geofences.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td>{item.status}</td>
                        <td>{item.fleetId ?? "All fleets"}</td>
                        <td>
                          {item.updatedAt
                            ? new Date(item.updatedAt).toLocaleString()
                            : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
