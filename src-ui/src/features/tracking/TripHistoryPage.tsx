import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function TripHistoryPage() {
  return (
    <div className="page">
      <PageHeader title="Trip History" subtitle="Trips and alerts" />
      <Card title="Trips">Trip table goes here.</Card>
    </div>
  );
}
