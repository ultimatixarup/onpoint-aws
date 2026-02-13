import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <div className="legal-page">
      <header className="legal-hero">
        <p className="legal-hero__eyebrow">Legal</p>
        <h1>Terms of Service</h1>
        <p className="legal-hero__subtitle">
          Please review the terms that govern use of the OnPoint platform.
        </p>
      </header>

      <section className="legal-card">
        <h2>Overview</h2>
        <p>
          Replace this section with your approved terms. Outline usage rights,
          responsibilities, and service availability.
        </p>
        <h2>Data and privacy</h2>
        <p>
          Describe how telemetry, trip, and user data are handled. Link to the
          privacy policy for detailed handling.
        </p>
        <h2>Service expectations</h2>
        <p>
          Define uptime targets, support channels, and limitations of liability.
        </p>
        <div className="legal-footer">
          <Link className="auth-link" to="/legal/privacy">
            Read privacy policy
          </Link>
        </div>
      </section>
    </div>
  );
}
