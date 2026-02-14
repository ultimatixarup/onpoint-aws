import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function DriverReportsPage() {
  return (
    <div className="page">
      <PageHeader
        title="Driver reports"
        subtitle="Generate and export driver performance reports."
      />
      <Card title="Reports">
        <div className="empty-state">
          Reports will appear here once exports are configured.
        </div>
        <Link className="btn btn--secondary" to="/adlp/reports">
          Go to reports
        </Link>
      </Card>
    </div>
  );
}
