export function LiveFeedPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Streaming</p>
        <h1>Live Feed</h1>
        <p className="ops-placeholder__subtitle">
          Monitor inbound events as they stream across the platform.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Signal</div>
        <h3>Waiting for live events</h3>
        <p className="text-muted">
          Live telemetry will appear once providers are connected.
        </p>
      </div>
    </div>
  );
}
