import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function FleetDashboard() {
  return (
    <div className="page">
      <PageHeader title="Fleet Dashboard" subtitle="Fleet level KPIs" />
      <div className="grid">
        <Card title="Fuel">Fuel and EV efficiency.</Card>
        <Card title="Maintenance">Upcoming service reminders.</Card>
        <Card title="Safety">Collision and alert trends.</Card>
      </div>
    </div>
  );
}
