import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";

export function DriverReportsPage() {
  return (
    <div className="page">
      <section className="insight-hero insight-hero--reports">
        <div className="insight-hero__glow" />
        <div className="insight-hero__content">
          <div>
            <p className="insight-hero__eyebrow">Reports</p>
            <h1>Driver reports</h1>
            <p className="insight-hero__subtitle">
              Generate and export driver performance reports for compliance and
              coaching.
            </p>
          </div>
          <div className="insight-hero__meta">
            <div className="insight-chip">Exports: --</div>
            <div className="insight-chip">Last run: --</div>
            <Link className="btn btn--secondary" to="/adlp/reports">
              Go to reports
            </Link>
          </div>
        </div>
      </section>

      <div className="report-grid">
        <Card title="Suggested reports">
          <div className="report-list">
            <div className="report-card">
              <div>
                <strong>Driver scorecards</strong>
                <p className="text-muted">Weekly performance summary</p>
              </div>
              <span className="report-card__tag">Queued</span>
            </div>
            <div className="report-card">
              <div>
                <strong>Compliance gaps</strong>
                <p className="text-muted">License + medical expirations</p>
              </div>
              <span className="report-card__tag">Draft</span>
            </div>
            <div className="report-card">
              <div>
                <strong>Safety events</strong>
                <p className="text-muted">Overspeed + harsh event rollups</p>
              </div>
              <span className="report-card__tag">Draft</span>
            </div>
          </div>
        </Card>
        <Card title="Exports">
          <div className="empty-state">
            Reports will appear here once exports are configured.
          </div>
        </Card>
      </div>
    </div>
  );
}
