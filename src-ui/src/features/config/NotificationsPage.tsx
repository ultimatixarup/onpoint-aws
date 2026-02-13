export function NotificationsPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Notifications</p>
        <h1>Notifications</h1>
        <p className="ops-placeholder__subtitle">
          Decide how alerts are routed across email, SMS, and webhook.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Bell</div>
        <h3>No notification rules</h3>
        <p className="text-muted">
          Configure notification preferences to stay informed.
        </p>
      </div>
    </div>
  );
}
