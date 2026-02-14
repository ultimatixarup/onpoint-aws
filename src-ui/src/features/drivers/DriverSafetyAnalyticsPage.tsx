import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function DriverSafetyAnalyticsPage() {
  return (
    <div className="page driver-dashboard">
      <PageHeader
        title="Safety analytics"
        subtitle="Monitor driver behavior, risk scores, and safety events."
      />
      <div className="driver-dashboard__actions">
        <Link className="btn" to="/adlp/drivers/summary">
          View driver directory
        </Link>
      </div>
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
    </div>
  );
}
