export function AddTripPage() {
  return (
    <div className="page trip-placeholder">
      <section className="trip-placeholder__hero">
        <p className="trip-placeholder__eyebrow">Trip creation</p>
        <h1>Add Trip</h1>
        <p className="trip-placeholder__subtitle">
          Create new trips and assign vehicles in a single flow.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Add</div>
        <h3>Trip creation form</h3>
        <p className="text-muted">
          Hook this page to your trip creation workflow.
        </p>
      </div>
    </div>
  );
}
