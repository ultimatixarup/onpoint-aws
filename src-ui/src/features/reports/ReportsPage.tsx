export function ReportsPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Analytics</p>
        <h1>Reports</h1>
        <p className="ops-placeholder__subtitle">
          Curated operational reports for leadership and compliance.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Report</div>
        <h3>No reports yet</h3>
        <p className="text-muted">
          Reports will appear once scheduled analytics are configured.
        </p>
      </div>
    </div>
  );
}
