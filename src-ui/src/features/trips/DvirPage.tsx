export function DvirPage() {
  return (
    <div className="page trip-placeholder">
      <section className="trip-placeholder__hero">
        <p className="trip-placeholder__eyebrow">Compliance</p>
        <h1>DVIR</h1>
        <p className="trip-placeholder__subtitle">
          Track inspection reports and resolve issues faster.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Checklist</div>
        <h3>No inspection reports</h3>
        <p className="text-muted">
          DVIR submissions will appear once drivers complete inspections.
        </p>
      </div>
    </div>
  );
}
