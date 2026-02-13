export function VehicleConsentPage() {
  return (
    <div className="page ops-placeholder">
      <section className="ops-placeholder__hero">
        <p className="ops-placeholder__eyebrow">Consent</p>
        <h1>Vehicle Consent</h1>
        <p className="ops-placeholder__subtitle">
          Manage OEM data sharing consents and compliance status.
        </p>
      </section>
      <div className="empty-state">
        <div className="empty-state__icon">Consent</div>
        <h3>No consent records</h3>
        <p className="text-muted">
          Connect OEM programs to manage vehicle consents here.
        </p>
      </div>
    </div>
  );
}
