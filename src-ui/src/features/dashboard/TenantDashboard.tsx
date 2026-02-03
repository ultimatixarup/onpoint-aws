import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function TenantDashboard() {
  return (
    <div className="page">
      <PageHeader title="Tenant Dashboard" subtitle="Fleet operations at a glance" />
      <div className="grid">
        <Card title="Active Vehicles">Telemetry online and offline status.</Card>
        <Card title="Trip Summary">Latest trips and alerts.</Card>
        <Card title="Safety">Driver safety score trends.</Card>
      </div>
    </div>
  );
}
