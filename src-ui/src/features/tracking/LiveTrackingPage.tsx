import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import {
    fetchFleets,
    fetchFleetVehicleStates,
    fetchVehicles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";

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

  const selectedFleetId = fleet?.id ?? (fleets.length === 1 ? fleets[0].fleetId : "");

  useEffect(() => {
    setSelectedVin("");
  }, [selectedFleetId]);

  const { data: vehicleStates = [], isLoading: isLoadingStates } = useQuery({
    queryKey: tenantId && selectedFleetId
      ? ["vehicle-state", tenantId, selectedFleetId]
      : ["vehicle-state", "none"],
    queryFn: () =>
      fetchFleetVehicleStates(tenantId, selectedFleetId, {
        from: "2000-01-01T00:00:00Z",
      }),
    enabled: Boolean(tenantId && selectedFleetId),
    refetchInterval: 30_000,
  });

  const { data: vehicles = [], isLoading: isLoadingVehicles } = useQuery({
    queryKey: tenantId && selectedFleetId
      ? ["fleet-vehicles", tenantId, selectedFleetId]
      : ["fleet-vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, selectedFleetId),
    enabled: Boolean(tenantId && selectedFleetId),
    staleTime: 5 * 60 * 1000,
  });

  const markers = useMemo(
    () =>
      vehicleStates
        .filter((state) => typeof state.lat === "number" && typeof state.lon === "number")
        .map((state) => ({
          ...state,
          position: [state.lat as number, state.lon as number] as [number, number],
        })),
    [vehicleStates],
  );

  const vehicleOptions = useMemo(
    () => vehicles.map((vehicle) => vehicle.vin),
    [vehicles],
  );

  const filteredMarkers = useMemo(
    () => (selectedVin ? markers.filter((marker) => marker.vin === selectedVin) : markers),
    [markers, selectedVin],
  );

  const center = useMemo<[number, number]>(() => {
    if (filteredMarkers.length === 0) return [37.0902, -95.7129];
    const lat =
      filteredMarkers.reduce((sum, m) => sum + m.position[0], 0) /
      filteredMarkers.length;
    const lon =
      filteredMarkers.reduce((sum, m) => sum + m.position[1], 0) /
      filteredMarkers.length;
    return [lat, lon];
  }, [filteredMarkers]);

  return (
    <div className="page">
      <PageHeader title="Live Tracking" subtitle="Real-time fleet location" />
      <Card title="Fleet Map">
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Fleet</span>
            <select
              className="select"
              value={selectedFleetId}
              onChange={(event) => {
                const selected = fleets.find((item) => item.fleetId === event.target.value);
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

        {isLoadingStates ? <p>Loading vehicle locations...</p> : null}
        {filteredMarkers.length === 0 && !isLoadingStates ? (
          <p>No vehicle locations available.</p>
        ) : (
          <div className="map-container">
            <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredMarkers.map((marker) => (
                <Marker key={marker.vin} position={marker.position} icon={carIcon}>
                  <Popup>
                    <div>
                      <strong>{marker.vin}</strong>
                      <div>Last event: {marker.lastEventTime ?? "--"}</div>
                      <div>Speed: {marker.speed_mph ?? "--"} mph</div>
                      <div>Status: {marker.vehicleState ?? "--"}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </Card>
      <Card title="Vehicle Feed">
        {filteredMarkers.length === 0 ? (
          <p>No vehicle state data available.</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>VIN</th>
                  <th>Last Event</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Speed (mph)</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkers.map((marker) => (
                  <tr key={marker.vin}>
                    <td>{marker.vin}</td>
                    <td>{marker.lastEventTime ?? "--"}</td>
                    <td>{marker.position[0].toFixed(5)}</td>
                    <td>{marker.position[1].toFixed(5)}</td>
                    <td>{marker.speed_mph ?? "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
