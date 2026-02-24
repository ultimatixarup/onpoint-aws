import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  fetchFleets,
  fetchFleetVehicleStates,
  fetchVehicles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { formatDate } from "../../utils/date";

const defaultIcon = L.icon({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const carIcon = L.icon({
  iconUrl: "/assets/car-marker.svg",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

L.Marker.prototype.options.icon = defaultIcon;

function formatApproxAddress(lat: number, lon: number) {
  const latDirection = lat >= 0 ? "N" : "S";
  const lonDirection = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(5)}°${latDirection}, ${Math.abs(lon).toFixed(5)}°${lonDirection}`;
}

export function LiveTrackingPage() {
  const { tenant } = useTenant();
  const { fleet, setFleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const [selectedVin, setSelectedVin] = useState<string>("");

  const { data: fleets = [], isLoading: isLoadingFleets } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const selectedFleetId =
    fleet?.id ?? (fleets.length === 1 ? fleets[0].fleetId : "");

  useEffect(() => {
    setSelectedVin("");
  }, [selectedFleetId]);

  const {
    data: vehicleStates = [],
    isLoading: isLoadingStates,
    refetch: refetchStates,
  } = useQuery({
    queryKey:
      tenantId && selectedFleetId
        ? ["vehicle-state", tenantId, selectedFleetId]
        : ["vehicle-state", "none"],
    queryFn: () =>
      fetchFleetVehicleStates(tenantId, selectedFleetId, {
        from: "2000-01-01T00:00:00Z",
      }),
    enabled: Boolean(tenantId && selectedFleetId),
    staleTime: 25_000,
    refetchOnWindowFocus: false,
    refetchInterval: 30_000,
  });

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey:
      tenantId && selectedFleetId
        ? ["fleet-vehicles", tenantId, selectedFleetId]
        : ["fleet-vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, selectedFleetId),
    enabled: Boolean(tenantId && selectedFleetId),
    staleTime: 5 * 60 * 1000,
  });

  const markers = useMemo(
    () =>
      vehicleStates
        .filter(
          (state) =>
            typeof state.lat === "number" && typeof state.lon === "number",
        )
        .map((state) => ({
          ...state,
          position: [state.lat as number, state.lon as number] as [
            number,
            number,
          ],
        })),
    [vehicleStates],
  );

  const vehicleOptions = useMemo(
    () => vehicles.map((vehicle) => vehicle.vin),
    [vehicles],
  );

  const filteredMarkers = useMemo(
    () =>
      selectedVin
        ? markers.filter((marker) => marker.vin === selectedVin)
        : markers,
    [markers, selectedVin],
  );

  const activeCount = filteredMarkers.length;
  const totalCount = markers.length;

  const center = useMemo<[number, number]>(() => {
    if (filteredMarkers.length === 0) return [37.0902, -95.7129];
    const lat =
      filteredMarkers.reduce((sum, marker) => sum + marker.position[0], 0) /
      filteredMarkers.length;
    const lon =
      filteredMarkers.reduce((sum, marker) => sum + marker.position[1], 0) /
      filteredMarkers.length;
    return [lat, lon];
  }, [filteredMarkers]);

  return (
    <div className="page tracking-page">
      <section className="tracking-hero">
        <div className="tracking-hero__glow" />
        <div className="tracking-hero__content">
          <div>
            <p className="tracking-hero__eyebrow">Live operations</p>
            <h1>Live Tracking</h1>
            <p className="tracking-hero__subtitle">
              Real-time fleet visibility with VIN-level filtering and map focus.
            </p>
          </div>
          <div className="tracking-hero__actions">
            <button className="btn" onClick={() => refetchStates()}>
              Refresh
            </button>
          </div>
        </div>
        <div className="tracking-metrics">
          <div className="tracking-metric">
            <span>Active vehicles</span>
            <strong>{activeCount}</strong>
            <span className="text-muted">On map</span>
          </div>
          <div className="tracking-metric">
            <span>Total reporting</span>
            <strong>{totalCount}</strong>
            <span className="text-muted">Fleet telemetry</span>
          </div>
          <div className="tracking-metric">
            <span>Status</span>
            <strong>{isLoadingStates ? "Syncing" : "Live"}</strong>
            <span className="text-muted">Updates every 30s</span>
          </div>
        </div>
      </section>

      <Card title="Filters">
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Fleet</span>
            <select
              className="select"
              value={selectedFleetId}
              onChange={(event) => {
                const selected = fleets.find(
                  (item) => item.fleetId === event.target.value,
                );
                if (selected) {
                  setFleet({ id: selected.fleetId, name: selected.name });
                } else {
                  setFleet(undefined);
                }
              }}
              disabled={isLoadingFleets}
            >
              <option value="" disabled>
                Select fleet
              </option>
              {fleets.map((item) => (
                <option key={item.fleetId} value={item.fleetId}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Vehicles</span>
            <select
              className="select"
              value={selectedVin}
              onChange={(event) => {
                setSelectedVin(event.target.value);
              }}
              disabled={isLoadingVehicles || vehicleOptions.length === 0}
            >
              <option value="">All vehicles</option>
              {vehicleOptions.map((vin) => (
                <option key={vin} value={vin}>
                  {vin}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="tracking-layout">
        <Card title="Fleet Map">
          {isLoadingStates ? <p>Loading vehicle locations...</p> : null}
          {filteredMarkers.length === 0 && !isLoadingStates ? (
            <p>No vehicle locations available.</p>
          ) : (
            <div className="map-container tracking-map">
              <MapContainer
                center={center}
                zoom={6}
                style={{ height: "100%", width: "100%" }}
              >
                <MapViewUpdater markers={filteredMarkers} center={center} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredMarkers.map((marker) => {
                  const [lat, lon] = marker.position;
                  return (
                    <Marker
                      key={marker.vin}
                      position={marker.position}
                      icon={carIcon}
                    >
                      <Popup>
                        <div>
                          <strong>{marker.vin}</strong>
                          <div>
                            Last event: {formatDate(marker.lastEventTime, "--")}
                          </div>
                          <div>
                            Approx location: {formatApproxAddress(lat, lon)}
                          </div>
                          <div>
                            Lat/Lon: {lat.toFixed(5)}, {lon.toFixed(5)}
                          </div>
                          <div>Speed: {marker.speed_mph ?? "--"} mph</div>
                          <div>Status: {marker.vehicleState ?? "--"}</div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}
        </Card>

        <Card title="Vehicle Feed">
          {filteredMarkers.length === 0 ? (
            <p>No vehicle state data available.</p>
          ) : (
            <div className="table-responsive tracking-feed-table">
              <table className="table table--tracking-feed">
                <thead>
                  <tr>
                    <th>VIN</th>
                    <th>Last Event Date</th>
                    <th>Address</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Speed (mph)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkers.map((marker) => {
                    const [lat, lon] = marker.position;

                    return (
                      <tr
                        key={marker.vin}
                        className={
                          selectedVin === marker.vin ? "is-selected" : undefined
                        }
                        onClick={() =>
                          setSelectedVin((current) =>
                            current === marker.vin ? "" : marker.vin,
                          )
                        }
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedVin((current) =>
                              current === marker.vin ? "" : marker.vin,
                            );
                          }
                        }}
                      >
                        <td>{marker.vin}</td>
                        <td>{formatDate(marker.lastEventTime, "--")}</td>
                        <td>{formatApproxAddress(lat, lon)}</td>
                        <td>{lat.toFixed(5)}</td>
                        <td>{lon.toFixed(5)}</td>
                        <td>{marker.speed_mph ?? "--"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function MapViewUpdater({
  markers,
  center,
}: {
  markers: Array<{ position: [number, number] }>;
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) {
      map.setView(center, 4, { animate: true });
      return;
    }
    if (markers.length === 1) {
      map.setView(markers[0].position, 10, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(markers.map((marker) => marker.position));
    map.fitBounds(bounds, { padding: [24, 24], animate: true });
  }, [center, map, markers]);

  return null;
}
