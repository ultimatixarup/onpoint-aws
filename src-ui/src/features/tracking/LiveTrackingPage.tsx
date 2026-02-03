import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function LiveTrackingPage() {
  return (
    <div className="page">
      <PageHeader title="Live Tracking" subtitle="Real-time fleet location" />
      <Card title="Map">Map view goes here.</Card>
    </div>
  );
}
