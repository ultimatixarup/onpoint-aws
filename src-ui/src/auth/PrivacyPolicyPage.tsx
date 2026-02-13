import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <div className="legal-page">
      <header className="legal-hero">
        <p className="legal-hero__eyebrow">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal-hero__subtitle">
          Details on how we collect, use, and protect your data.
        </p>
      </header>

      <section className="legal-card">
        <h2>Data collection</h2>
        <p>
          Provide your official policy here. Explain what data is collected and
          why it is required for fleet operations.
        </p>
        <h2>Usage and storage</h2>
        <p>
          Describe retention, storage locations, and access controls that apply
          to tenant data.
        </p>
        <h2>Your choices</h2>
        <p>
          Include contact information and instructions for data access or
          deletion requests.
        </p>
        <div className="legal-footer">
          <Link className="auth-link" to="/legal/terms">
            View terms of service
          </Link>
        </div>
      </section>
    </div>
  );
}
