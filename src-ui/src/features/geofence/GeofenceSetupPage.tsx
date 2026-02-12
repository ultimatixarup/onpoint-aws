import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { FeatureGroup, MapContainer, TileLayer, useMap } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import { fetchFleets } from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { GeofenceShape, useGeofenceStore } from "./geofenceStore";

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

export function GeofenceSetupPage() {
  const { tenant } = useTenant();
  const { fleet, setFleet } = useFleet();
  const tenantId = tenant?.id ?? "";
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [fleetId, setFleetId] = useState(fleet?.id ?? "");
  const [draftShape, setDraftShape] = useState<GeofenceShape | null>(null);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const layerRef = useRef<L.Layer | null>(null);

  const { createGeofence } = useGeofenceStore(tenantId);

  const { data: fleets = [], isLoading: isLoadingFleets } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
  });

  const fleetOptions = useMemo(
    () => fleets.map((item) => ({ id: item.fleetId, name: item.name })),
    [fleets],
  );

  const shapeSummary = useMemo(() => {
    if (!draftShape) return "Draw a geofence on the map to capture geometry.";
    if (draftShape.type === "CIRCLE") {
      const center = draftShape.center;
      return center
        ? `Circle · ${center[0].toFixed(5)}, ${center[1].toFixed(5)} · ${Math.round(
            draftShape.radiusMeters ?? 0,
          )}m`
        : "Circle";
    }
    if (draftShape.type === "POINT") {
      const center = draftShape.center;
      return center
        ? `Point · ${center[0].toFixed(5)}, ${center[1].toFixed(5)}`
        : "Point";
    }
    return `${draftShape.type} · ${draftShape.coordinates?.length ?? 0} vertices`;
  }, [draftShape]);

  const coordinateText = useMemo(() => {
    if (!draftShape) return "";
    if (draftShape.type === "CIRCLE" || draftShape.type === "POINT") {
      const center = draftShape.center;
      return center
        ? `Center: ${center[0].toFixed(6)}, ${center[1].toFixed(6)}`
        : "";
    }
    const coords = draftShape.coordinates ?? [];
    return coords
      .map((coord) => `${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`)
      .join("\n");
  }, [draftShape]);

  const handleCreated = (event: any) => {
    const layer = event.layer as L.Layer;
    const shape = getShapeFromLayer(layer, event.layerType);
    if (!shape) return;
    featureGroupRef.current?.clearLayers();
    featureGroupRef.current?.addLayer(layer);
    layerRef.current = layer;
    setDraftShape(shape);
    setFormError("");
    setSuccessMessage("");
  };

  const handleEdited = (event: any) => {
    const layers = event.layers?.getLayers?.() ?? [];
    const layer = layers[0];
    if (!layer) return;
    const shape = getShapeFromLayer(layer);
    if (!shape) return;
    layerRef.current = layer;
    setDraftShape(shape);
  };

  const handleDeleted = () => {
    layerRef.current = null;
    setDraftShape(null);
  };

  const clearShape = () => {
    featureGroupRef.current?.clearLayers();
    layerRef.current = null;
    setDraftShape(null);
  };

  const handleRadiusChange = (value: string) => {
    const radiusMeters = Number(value);
    if (!draftShape || draftShape.type !== "CIRCLE") return;
    if (!Number.isFinite(radiusMeters)) return;
    setDraftShape({ ...draftShape, radiusMeters });
    if (layerRef.current && layerRef.current instanceof L.Circle) {
      layerRef.current.setRadius(radiusMeters);
    }
  };

  const handleSave = () => {
    setFormError("");
    setSuccessMessage("");
    if (!tenantId) {
      setFormError("Select a tenant before creating a geofence.");
      return;
    }
    if (!name.trim()) {
      setFormError("Provide a name for the geofence.");
      return;
    }
    if (!draftShape) {
      setFormError("Draw a geofence on the map to continue.");
      return;
    }

    createGeofence({
      name: name.trim(),
      description: description.trim() || undefined,
      type: draftShape.type,
      status,
      tenantId,
      fleetId: fleetId || undefined,
      shape: draftShape,
    });

    setSuccessMessage("Geofence saved to the tenant workspace.");
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    clearShape();
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <PageHeader
          title="Geofence Setup"
          subtitle="Draw and save geofences for tenant fleets"
        />
      </div>
      <Card title="Create Geofence">
        {!tenantId ? (
          <p>Select a tenant to begin configuring geofences.</p>
        ) : (
          <div className="geofence-layout">
            <div className="stack">
              <div className="form-grid">
                <label className="form__field">
                  <span>Name</span>
                  <input
                    className="input"
                    placeholder="Warehouse West"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className="form__field">
                  <span>Description</span>
                  <input
                    className="input"
                    placeholder="Optional details"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>
                <label className="form__field">
                  <span>Scope Fleet (optional)</span>
                  <select
                    className="select"
                    value={fleetId}
                    onChange={(event) => {
                      const selected = fleets.find(
                        (item) => item.fleetId === event.target.value,
                      );
                      if (selected) {
                        setFleet({ id: selected.fleetId, name: selected.name });
                        setFleetId(selected.fleetId);
                      } else {
                        setFleet(undefined);
                        setFleetId("");
                      }
                    }}
                    disabled={isLoadingFleets}
                  >
                    <option value="">All fleets (tenant-wide)</option>
                    {fleetOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form__field">
                  <span>Status</span>
                  <select
                    className="select"
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as "ACTIVE" | "INACTIVE")
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </label>
              </div>

              <div className="section">
                <div className="section__title">Geometry</div>
                <p className="text-muted">{shapeSummary}</p>
                {draftShape?.type === "CIRCLE" ? (
                  <label className="form__field">
                    <span>Radius (meters)</span>
                    <input
                      className="input"
                      type="number"
                      min={10}
                      value={Math.round(draftShape.radiusMeters ?? 0)}
                      onChange={(event) =>
                        handleRadiusChange(event.target.value)
                      }
                    />
                  </label>
                ) : null}
                <textarea
                  className="textarea"
                  readOnly
                  value={coordinateText}
                  placeholder="Coordinates will appear here after drawing."
                />
              </div>

              {formError ? <div className="error">{formError}</div> : null}
              {successMessage ? (
                <div className="banner banner--warning">{successMessage}</div>
              ) : null}

              <div className="form__actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={clearShape}
                >
                  Clear Map
                </button>
                <button type="button" className="btn" onClick={handleSave}>
                  Save Geofence
                </button>
              </div>
            </div>

            <div className="stack">
              <div className="map-container">
                <MapContainer
                  center={DEFAULT_CENTER}
                  zoom={4}
                  style={{ height: "100%", width: "100%" }}
                >
                  <MapViewFocus shape={draftShape ?? undefined} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <FeatureGroup ref={featureGroupRef}>
                    <EditControl
                      position="topright"
                      onCreated={handleCreated}
                      onEdited={handleEdited}
                      onDeleted={handleDeleted}
                      draw={{
                        polyline: false,
                        circlemarker: false,
                        polygon: true,
                        rectangle: true,
                        circle: true,
                        marker: true,
                      }}
                    />
                  </FeatureGroup>
                </MapContainer>
              </div>
              <p className="text-muted">
                Draw a circle, polygon, rectangle, or point. Use the edit tool
                to adjust vertices before saving.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function getShapeFromLayer(layer: L.Layer, layerType?: string): GeofenceShape | null {
  if (layer instanceof L.Circle) {
    const center = layer.getLatLng();
    return {
      type: "CIRCLE",
      center: [center.lat, center.lng],
      radiusMeters: layer.getRadius(),
    };
  }
  if (layer instanceof L.Marker) {
    const center = layer.getLatLng();
    return {
      type: "POINT",
      center: [center.lat, center.lng],
    };
  }
  if (layer instanceof L.Rectangle) {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
    return {
      type: "RECTANGLE",
      coordinates: latlngs.map((latlng) => [latlng.lat, latlng.lng]),
    };
  }
  if (layer instanceof L.Polygon || layerType === "polygon") {
    const latlngs = (layer as L.Polygon).getLatLngs()[0] as L.LatLng[];
    return {
      type: "POLYGON",
      coordinates: latlngs.map((latlng) => [latlng.lat, latlng.lng]),
    };
  }
  return null;
}

function MapViewFocus({ shape }: { shape?: GeofenceShape }) {
  const map = useMap();

  useEffect(() => {
    if (!shape) {
      map.setView(DEFAULT_CENTER, 4, { animate: true });
      return;
    }
    if (shape.type === "POINT" && shape.center) {
      map.setView(shape.center, 12, { animate: true });
      return;
    }
    if (shape.type === "CIRCLE" && shape.center) {
      const radius = Number(shape.radiusMeters);
      if (Number.isFinite(radius) && radius > 0) {
        const bounds = L.latLng(shape.center).toBounds(radius * 2);
        map.fitBounds(bounds, { padding: [24, 24], animate: true });
      } else {
        map.setView(shape.center, 12, { animate: true });
      }
      return;
    }
    if (shape.coordinates && shape.coordinates.length > 0) {
      const bounds = L.latLngBounds(
        shape.coordinates.map((coord) => [coord[0], coord[1]]),
      );
      map.fitBounds(bounds, { padding: [24, 24], animate: true });
    }
  }, [map, shape]);

  return null;
}
