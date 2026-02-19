import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import {
    Circle,
    MapContainer,
    Marker,
    Polygon,
    Popup,
    TileLayer,
    useMap,
} from "react-leaflet";
import { fetchFleets } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { formatDate } from "../../utils/date";
import {
    GeofenceRecord,
    GeofenceType,
    useGeofenceStore,
} from "./geofenceStore";

const defaultIcon = L.icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

const DEFAULT_CENTER: [number, number] = [37.0902, -95.7129];

export function ManageGeofencePage() {
  const { tenant } = useTenant();
  const { fleet, setFleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [typeFilter, setTypeFilter] = useState<GeofenceType | "ALL">("ALL");
  const [fleetFilter, setFleetFilter] = useState(fleet?.id ?? "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [editFleetId, setEditFleetId] = useState("");

  const { geofences, updateGeofence, removeGeofence } =
    useGeofenceStore(tenantId);

  const { data: fleets = [], isLoading: isLoadingFleets } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const filteredGeofences = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return geofences.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;
      if (fleetFilter && item.fleetId !== fleetFilter) return false;
      if (
        normalizedSearch &&
        !`${item.name} ${item.description ?? ""}`
          .toLowerCase()
          .includes(normalizedSearch)
      ) {
        return false;
      }
      return true;
    });
  }, [geofences, search, statusFilter, typeFilter, fleetFilter]);

  const geofenceStats = useMemo(() => {
    const total = geofences.length;
    const active = geofences.filter((item) => item.status === "ACTIVE").length;
    const inactive = geofences.filter(
      (item) => item.status === "INACTIVE",
    ).length;
    return { total, active, inactive };
  }, [geofences]);

  const selectedGeofence = useMemo(
    () =>
      filteredGeofences.find((item) => item.id === selectedId) ??
      filteredGeofences[0] ??
      null,
    [filteredGeofences, selectedId],
  );

  useEffect(() => {
    if (selectedGeofence?.id && selectedGeofence.id !== selectedId) {
      setSelectedId(selectedGeofence.id);
    }
  }, [selectedGeofence, selectedId]);

  useEffect(() => {
    if (!selectedGeofence) {
      setEditName("");
      setEditDescription("");
      setEditStatus("ACTIVE");
      setEditFleetId("");
      return;
    }
    setEditName(selectedGeofence.name);
    setEditDescription(selectedGeofence.description ?? "");
    setEditStatus(selectedGeofence.status);
    setEditFleetId(selectedGeofence.fleetId ?? "");
  }, [selectedGeofence]);

  return (
    <div className="page geofence-page">
      <section className="geofence-hero">
        <div className="geofence-hero__glow" />
        <div className="geofence-hero__content">
          <div>
            <p className="geofence-hero__eyebrow">Zone management</p>
            <h1>Manage Geofences</h1>
            <p className="geofence-hero__subtitle">
              Review, filter, and update saved geofence zones.
            </p>
          </div>
        </div>
        <div className="geofence-stats">
          <div className="geofence-stat">
            <span>Total zones</span>
            <strong>{geofenceStats.total}</strong>
            <span className="text-muted">All geofences</span>
          </div>
          <div className="geofence-stat">
            <span>Active</span>
            <strong>{geofenceStats.active}</strong>
            <span className="text-muted">Monitoring enabled</span>
          </div>
          <div className="geofence-stat">
            <span>Inactive</span>
            <strong>{geofenceStats.inactive}</strong>
            <span className="text-muted">Paused zones</span>
          </div>
        </div>
      </section>
      <Card title="Geofence Library">
        {!tenantId ? (
          <p>Select a tenant to view geofences.</p>
        ) : (
          <div className="geofence-layout">
            <div className="stack">
              <div className="form-grid">
                <label className="form__field">
                  <span>Search</span>
                  <input
                    className="input"
                    placeholder="Search by name"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <label className="form__field">
                  <span>Status</span>
                  <select
                    className="select"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value as "ALL" | "ACTIVE" | "INACTIVE",
                      )
                    }
                  >
                    <option value="ALL">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
                <label className="form__field">
                  <span>Type</span>
                  <select
                    className="select"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value as GeofenceType | "ALL")
                    }
                  >
                    <option value="ALL">All</option>
                    <option value="CIRCLE">Circle</option>
                    <option value="POLYGON">Polygon</option>
                    <option value="RECTANGLE">Rectangle</option>
                    <option value="POINT">Point</option>
                  </select>
                </label>
                <label className="form__field">
                  <span>Fleet</span>
                  <select
                    className="select"
                    value={fleetFilter}
                    onChange={(event) => {
                      const selected = fleets.find(
                        (item) => item.fleetId === event.target.value,
                      );
                      if (selected) {
                        setFleet({ id: selected.fleetId, name: selected.name });
                        setFleetFilter(selected.fleetId);
                      } else {
                        setFleet(undefined);
                        setFleetFilter("");
                      }
                    }}
                    disabled={isLoadingFleets}
                  >
                    <option value="">All fleets</option>
                    {fleets.map((item) => (
                      <option key={item.fleetId} value={item.fleetId}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredGeofences.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state__icon">🗺️</div>
                  <strong>No geofences yet</strong>
                  <span className="text-muted">
                    Create a geofence in the setup page to populate this list.
                  </span>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Fleet</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGeofences.map((item) => (
                        <tr
                          key={item.id}
                          className={
                            selectedGeofence?.id === item.id
                              ? "is-selected"
                              : undefined
                          }
                          onClick={() => setSelectedId(item.id)}
                        >
                          <td>
                            <strong>{item.name}</strong>
                            {item.description ? (
                              <div className="text-muted">
                                {item.description}
                              </div>
                            ) : null}
                          </td>
                          <td>{item.type}</td>
                          <td>
                            <span
                              className={
                                item.status === "ACTIVE"
                                  ? "badge badge--active"
                                  : "badge badge--inactive"
                              }
                            >
                              {item.status}
                            </span>
                          </td>
                          <td>{item.fleetId ?? "All fleets"}</td>
                          <td>
                            {formatDate(item.updatedAt, "--")}
                          </td>
                          <td>
                            <div className="inline">
                              <button
                                type="button"
                                className="icon-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateGeofence(item.id, {
                                    status:
                                      item.status === "ACTIVE"
                                        ? "INACTIVE"
                                        : "ACTIVE",
                                  });
                                }}
                              >
                                {item.status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                              </button>
                              <button
                                type="button"
                                className="icon-button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  removeGeofence(item.id);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="stack">
              <div className="map-container">
                <MapContainer
                  center={DEFAULT_CENTER}
                  zoom={4}
                  style={{ height: "100%", width: "100%" }}
                >
                  <MapFocus geofence={selectedGeofence ?? undefined} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {filteredGeofences.map((item) => (
                    <GeofenceLayer
                      key={item.id}
                      geofence={item}
                      isSelected={item.id === selectedGeofence?.id}
                    />
                  ))}
                </MapContainer>
              </div>
              {selectedGeofence ? (
                <Card title="Selected Geofence">
                  <div className="detail-grid">
                    <div>
                      <p className="stat__label">Name</p>
                      <p className="stat__value">{selectedGeofence.name}</p>
                    </div>
                    <div>
                      <p className="stat__label">Type</p>
                      <p className="stat__value">{selectedGeofence.type}</p>
                    </div>
                    <div>
                      <p className="stat__label">Status</p>
                      <p className="stat__value">{selectedGeofence.status}</p>
                    </div>
                    <div>
                      <p className="stat__label">Fleet</p>
                      <p className="stat__value">
                        {selectedGeofence.fleetId ?? "All fleets"}
                      </p>
                    </div>
                  </div>
                  {selectedGeofence.description ? (
                    <p className="text-muted">{selectedGeofence.description}</p>
                  ) : null}
                  <div className="section">
                    <div className="section__title">Edit details</div>
                    <div className="form-grid">
                      <label className="form__field">
                        <span>Name</span>
                        <input
                          className="input"
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                        />
                      </label>
                      <label className="form__field">
                        <span>Description</span>
                        <input
                          className="input"
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                        />
                      </label>
                      <label className="form__field">
                        <span>Status</span>
                        <select
                          className="select"
                          value={editStatus}
                          onChange={(event) =>
                            setEditStatus(
                              event.target.value as "ACTIVE" | "INACTIVE",
                            )
                          }
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </label>
                      <label className="form__field">
                        <span>Fleet</span>
                        <select
                          className="select"
                          value={editFleetId}
                          onChange={(event) =>
                            setEditFleetId(event.target.value)
                          }
                          disabled={isLoadingFleets}
                        >
                          <option value="">All fleets</option>
                          {fleets.map((item) => (
                            <option key={item.fleetId} value={item.fleetId}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="form__actions">
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          if (!selectedGeofence) return;
                          setEditName(selectedGeofence.name);
                          setEditDescription(
                            selectedGeofence.description ?? "",
                          );
                          setEditStatus(selectedGeofence.status);
                          setEditFleetId(selectedGeofence.fleetId ?? "");
                        }}
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => {
                          if (!selectedGeofence) return;
                          updateGeofence(selectedGeofence.id, {
                            name: editName.trim() || selectedGeofence.name,
                            description: editDescription.trim() || undefined,
                            status: editStatus,
                            fleetId: editFleetId || undefined,
                          });
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function GeofenceLayer({
  geofence,
  isSelected,
}: {
  geofence: GeofenceRecord;
  isSelected: boolean;
}) {
  const color = isSelected ? "#4f46e5" : "#f97316";

  if (geofence.type === "CIRCLE" && geofence.shape.center) {
    return (
      <Circle
        center={geofence.shape.center}
        radius={geofence.shape.radiusMeters ?? 0}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.2 }}
      >
        <Popup>
          <strong>{geofence.name}</strong>
          <div>{geofence.type}</div>
        </Popup>
      </Circle>
    );
  }

  if (geofence.type === "POINT" && geofence.shape.center) {
    return (
      <Marker position={geofence.shape.center}>
        <Popup>
          <strong>{geofence.name}</strong>
          <div>{geofence.type}</div>
        </Popup>
      </Marker>
    );
  }

  if (geofence.shape.coordinates?.length) {
    return (
      <Polygon
        positions={geofence.shape.coordinates}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.2 }}
      >
        <Popup>
          <strong>{geofence.name}</strong>
          <div>{geofence.type}</div>
        </Popup>
      </Polygon>
    );
  }

  return null;
}

function MapFocus({ geofence }: { geofence?: GeofenceRecord }) {
  const map = useMap();

  useEffect(() => {
    if (!geofence) {
      map.setView(DEFAULT_CENTER, 4, { animate: true });
      return;
    }
    if (geofence.type === "POINT" && geofence.shape.center) {
      map.setView(geofence.shape.center, 12, { animate: true });
      return;
    }
    if (geofence.type === "CIRCLE" && geofence.shape.center) {
      const radius = Number(geofence.shape.radiusMeters);
      if (Number.isFinite(radius) && radius > 0) {
        const bounds = L.latLng(geofence.shape.center).toBounds(radius * 2);
        map.fitBounds(bounds, { padding: [24, 24], animate: true });
      } else {
        map.setView(geofence.shape.center, 12, { animate: true });
      }
      return;
    }
    if (geofence.shape.coordinates?.length) {
      const bounds = L.latLngBounds(
        geofence.shape.coordinates.map((coord) => [coord[0], coord[1]]),
      );
      map.fitBounds(bounds, { padding: [24, 24], animate: true });
    }
  }, [geofence, map]);

  return null;
}
