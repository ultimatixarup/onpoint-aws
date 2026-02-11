import { useMemo, useState } from "react";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { GeofenceRecord, useGeofenceStore } from "./geofenceStore";

export function GeofenceAlertsPage() {
  const { tenant } = useTenant();
  const tenantId = tenant?.id ?? "";
  const { geofences, updateGeofence } = useGeofenceStore(tenantId);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return geofences.filter((item) =>
      needle
        ? `${item.name} ${item.description ?? ""}`
            .toLowerCase()
            .includes(needle)
        : true,
    );
  }, [geofences, search]);

  return (
    <div className="page">
      <PageHeader
        title="Geofence Alerts"
        subtitle="Configure alert rules per geofence"
      />
      <Card title="Alert Rules">
        {!tenantId ? (
          <p>Select a tenant to configure alerts.</p>
        ) : geofences.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon">🔔</div>
            <strong>No geofences available</strong>
            <span className="text-muted">
              Create a geofence first to enable alerts.
            </span>
          </div>
        ) : (
          <div className="stack">
            <label className="form__field">
              <span>Search</span>
              <input
                className="input"
                placeholder="Search geofences"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            {filtered.length === 0 ? (
              <p>No geofences match the search.</p>
            ) : (
              filtered.map((geofence) => (
                <AlertCard
                  key={geofence.id}
                  geofence={geofence}
                  onUpdate={updateGeofence}
                />
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function AlertCard({
  geofence,
  onUpdate,
}: {
  geofence: GeofenceRecord;
  onUpdate: (id: string, update: Partial<GeofenceRecord>) => void;
}) {
  return (
    <div className="card">
      <div className="card__title">{geofence.name}</div>
      <div className="card__body">
        <div className="detail-grid">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={geofence.alerts.enter}
              onChange={(event) =>
                onUpdate(geofence.id, {
                  alerts: { ...geofence.alerts, enter: event.target.checked },
                })
              }
            />
            Enter
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={geofence.alerts.exit}
              onChange={(event) =>
                onUpdate(geofence.id, {
                  alerts: { ...geofence.alerts, exit: event.target.checked },
                })
              }
            />
            Exit
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={geofence.alerts.dwell}
              onChange={(event) =>
                onUpdate(geofence.id, {
                  alerts: { ...geofence.alerts, dwell: event.target.checked },
                })
              }
            />
            Dwell
          </label>
        </div>

        <div className="section">
          <div className="section__title">Channels</div>
          <div className="detail-grid">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={geofence.alerts.channels.email}
                onChange={(event) =>
                  onUpdate(geofence.id, {
                    alerts: {
                      ...geofence.alerts,
                      channels: {
                        ...geofence.alerts.channels,
                        email: event.target.checked,
                      },
                    },
                  })
                }
              />
              Email
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={geofence.alerts.channels.sms}
                onChange={(event) =>
                  onUpdate(geofence.id, {
                    alerts: {
                      ...geofence.alerts,
                      channels: {
                        ...geofence.alerts.channels,
                        sms: event.target.checked,
                      },
                    },
                  })
                }
              />
              SMS
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={geofence.alerts.channels.webhook}
                onChange={(event) =>
                  onUpdate(geofence.id, {
                    alerts: {
                      ...geofence.alerts,
                      channels: {
                        ...geofence.alerts.channels,
                        webhook: event.target.checked,
                      },
                    },
                  })
                }
              />
              Webhook
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
