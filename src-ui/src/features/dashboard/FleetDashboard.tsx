export function FleetDashboard() {
  return (
    <div className="page fleet-dashboard">
      <section className="fleet-dashboard__hero">
        <div className="fleet-dashboard__glow" />
        <div>
          <p className="fleet-dashboard__eyebrow">Fleet overview</p>
          <h1>Fleet Dashboard</h1>
          <p className="fleet-dashboard__subtitle">
            Fleet-level KPIs, readiness signals, and operational insights.
          </p>
        </div>
      </section>
      <div className="fleet-dashboard__cards">
        <div className="fleet-card">
          <h3>Fuel</h3>
          <p className="text-muted">Fuel and EV efficiency trends.</p>
        </div>
        <div className="fleet-card">
          <h3>Maintenance</h3>
          <p className="text-muted">Upcoming service reminders.</p>
        </div>
        <div className="fleet-card">
          <h3>Safety</h3>
          <p className="text-muted">Collision and alert trends.</p>
        </div>
      </div>
    </div>
  );
}
