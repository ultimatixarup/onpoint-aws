export function VinHistoryPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Vehicle history</p>
        <h1>VIN History</h1>
        <p className="ops-placeholder__subtitle">
          Trace vehicle events, ownership, and lifecycle milestones.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">History</div>
        <h3>No history available</h3>
        <p className="text-muted">
          Select a VIN to view service, trip, and telemetry history.
        </p>
      </div>
    </div>
  );
}
