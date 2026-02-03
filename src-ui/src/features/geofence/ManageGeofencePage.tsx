import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

export function ManageGeofencePage() {
  return (
    <div className="page">
      <PageHeader title="Manage Geofence" />
      <Card title="Geofences">List of geofences.</Card>
    </div>
  );
}
