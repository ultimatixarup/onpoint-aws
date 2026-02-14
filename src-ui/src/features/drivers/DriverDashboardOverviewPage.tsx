import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function DriverDashboardOverviewPage() {
  return (
    <div className="page driver-dashboard">
      <PageHeader
        title="Driver dashboard"
        subtitle="Select a driver to view detailed safety and efficiency analytics."
      />
      <div className="driver-dashboard__actions">
        <Link className="btn" to="/adlp/drivers/summary">
          Go to driver directory
        </Link>
      </div>
      <Card title="Safety & efficiency overview">
        <div className="kpi-grid">
          <div className="kpi-card">
            <span>Total miles</span>
            <strong>--</strong>
          </div>
          <div className="kpi-card">
            <span>Driving time</span>
            <strong>--</strong>
          </div>
          <div className="kpi-card">
            <span>Night miles</span>
            <strong>--</strong>
          </div>
          <div className="kpi-card">
            <span>Average speed</span>
            <strong>--</strong>
          </div>
          <div className="kpi-card">
            <span>Safety score</span>
            <strong>--</strong>
          </div>
          <div className="kpi-card">
            <span>Fuel efficiency</span>
            <strong>--</strong>
          </div>
        </div>
        <div className="empty-state">
          Select a driver to load analytics, trips, and event drilldowns.
        </div>
      </Card>
    </div>
  );
}
