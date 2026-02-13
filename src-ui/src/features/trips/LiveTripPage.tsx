export function LiveTripPage() {
  return (
    <div className="page trip-placeholder">
      <section className="trip-placeholder__hero">
        <p className="trip-placeholder__eyebrow">Live monitoring</p>
        <h1>Live Trip</h1>
        <p className="trip-placeholder__subtitle">
          Live trip tracking will appear here once a vehicle is en route.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Route</div>
        <h3>No active trips</h3>
        <p className="text-muted">Start a trip to see live progress.</p>
      </div>
    </div>
  );
}
