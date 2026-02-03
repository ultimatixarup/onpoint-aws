import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function TelemetryRawPage() {
  return (
    <div className="page">
      <PageHeader title="Telemetry (Raw)" subtitle="Provider payloads" />
      <Card title="Raw Stream">Raw telemetry feed placeholder.</Card>
    </div>
  );
}
