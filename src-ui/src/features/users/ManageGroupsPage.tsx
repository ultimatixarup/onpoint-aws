export function ManageGroupsPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Identity</p>
        <h1>Manage Groups</h1>
        <p className="ops-placeholder__subtitle">
          Assign permissions and group drivers, fleets, and admins.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Groups</div>
        <h3>No groups configured</h3>
        <p className="text-muted">
          Set up groups to segment access and responsibilities.
        </p>
      </div>
    </div>
  );
}
