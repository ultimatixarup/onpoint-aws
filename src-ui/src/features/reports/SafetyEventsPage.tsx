export function SafetyEventsPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Safety</p>
        <h1>Safety Events</h1>
        <p className="ops-placeholder__subtitle">
          Review safety alerts, high-risk trips, and incident flags.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Shield</div>
        <h3>No safety events</h3>
        <p className="text-muted">
          Events will populate as telemetry detects risky behavior.
        </p>
      </div>
    </div>
  );
}
