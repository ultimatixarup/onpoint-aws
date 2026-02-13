export function ConfigurationPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Administration</p>
        <h1>Configuration</h1>
        <p className="ops-placeholder__subtitle">
          Manage environment settings, integrations, and data policies.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Settings</div>
        <h3>Configuration center</h3>
        <p className="text-muted">
          Define platform defaults and service connections here.
        </p>
      </div>
    </div>
  );
}
