export function RouteOptimizationPage() {
  return (
    <div className="page trip-placeholder">
      <section className="trip-placeholder__hero">
        <p className="trip-placeholder__eyebrow">Optimization</p>
        <h1>Route Optimization</h1>
        <p className="trip-placeholder__subtitle">
          Reduce miles, balance stops, and improve on-time performance.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Optimize</div>
        <h3>Optimization engine pending</h3>
        <p className="text-muted">
          Connect routing rules to generate optimized routes.
        </p>
      </div>
    </div>
  );
}
