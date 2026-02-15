import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";

export function DriverSafetyAnalyticsPage() {
  return (
    <div className="page driver-dashboard">
      <section className="insight-hero insight-hero--safety">
        <div className="insight-hero__glow" />
        <div className="insight-hero__content">
          <div>
            <p className="insight-hero__eyebrow">Safety analytics</p>
            <h1>Driver safety analytics</h1>
            <p className="insight-hero__subtitle">
              Monitor driver behavior, risk scores, and critical safety events.
            </p>
          </div>
          <div className="insight-hero__meta">
            <div className="insight-chip">Harsh braking: --</div>
            <div className="insight-chip">Overspeed events: --</div>
            <div className="insight-chip">Safety score: --</div>
            <Link className="btn" to="/adlp/drivers/summary">
              View driver directory
            </Link>
          </div>
        </div>
      </section>

      <div className="insight-grid">
        <Card title="Safety KPI snapshot">
          <div className="kpi-grid">
            <div className="kpi-card">
              <span>Harsh braking</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Harsh acceleration</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Harsh cornering</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Seatbelt violations</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Overspeed events</span>
              <strong>--</strong>
            </div>
            <div className="kpi-card">
              <span>Safety score</span>
              <strong>--</strong>
            </div>
          </div>
          <div className="empty-state">
            Select a driver to drill into safety events and trends.
          </div>
        </Card>
        <Card title="Focus areas">
          <ul className="insight-list">
            <li>Review harsh events to prioritize coaching.</li>
            <li>Track overspeed patterns across shifts and routes.</li>
            <li>Use safety score trends to verify improvements.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
