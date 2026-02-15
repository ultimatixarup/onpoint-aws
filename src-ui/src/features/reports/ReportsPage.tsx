export function ReportsPage() {
  return (
    <div className="page ops-placeholder">
      <section className="insight-hero insight-hero--reports">
        <div className="insight-hero__glow" />
        <div className="insight-hero__content">
          <div>
            <p className="insight-hero__eyebrow">Analytics</p>
            <h1>Reports</h1>
            <p className="insight-hero__subtitle">
              Curated operational reports for leadership, compliance, and
              customer success.
            </p>
          </div>
          <div className="insight-hero__meta">
            <div className="insight-chip">Scheduled: --</div>
            <div className="insight-chip">Last export: --</div>
          </div>
        </div>
      </section>

      <div className="report-grid">
        <div className="empty-state">
          <div className="empty-state__icon">Report</div>
          <h3>No reports yet</h3>
          <p className="text-muted">
            Reports will appear once scheduled analytics are configured.
          </p>
        </div>
        <div className="report-panel">
          <h3>Popular templates</h3>
          <ul className="insight-list">
            <li>Fleet utilization summary</li>
            <li>Safety incidents by driver</li>
            <li>Compliance readiness audit</li>
            <li>Fuel efficiency trends</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
