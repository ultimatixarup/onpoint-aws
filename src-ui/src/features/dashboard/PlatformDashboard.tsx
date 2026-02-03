import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function PlatformDashboard() {
  return (
    <div className="page">
      <PageHeader title="Platform Admin Dashboard" subtitle="Global tenancy overview" />
      <div className="grid">
        <Card title="Tenants">Summary of active tenants.</Card>
        <Card title="Fleets">Fleet utilization snapshot.</Card>
        <Card title="Ingest">Provider status and SLA.</Card>
      </div>
    </div>
  );
}
