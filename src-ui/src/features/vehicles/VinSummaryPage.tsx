import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function VinSummaryPage() {
  return (
    <div className="page">
      <PageHeader title="VIN Summary" />
      <Card title="VIN Overview">VIN summary table.</Card>
    </div>
  );
}
