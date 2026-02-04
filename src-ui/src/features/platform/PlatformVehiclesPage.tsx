import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import {
  createVehicle,
  fetchTenants,
  fetchVehicles,
  updateVehicle,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";

function parseJson(value: string) {
  if (!value.trim()) return undefined;
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export function PlatformVehiclesPage() {
  const queryClient = useQueryClient();
  const { data: tenants = [] } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });
  const [tenantId, setTenantId] = useState("");
  const [fleetId, setFleetId] = useState("");

  const {
    data: vehicles = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId || undefined)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId || undefined),
    enabled: Boolean(tenantId && fleetId),
  });

  const [vin, setVin] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("ACTIVE");

  const [editVin, setEditVin] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [assetTags, setAssetTags] = useState("");
  const [metadata, setMetadata] = useState("");

  const handleCreate = async () => {
    if (!vin) return;
    await createVehicle({
      vin,
      make: make || undefined,
      model: model || undefined,
      year: year || undefined,
      status,
    });
    setVin("");
    setMake("");
    setModel("");
    setYear("");
    queryClient.invalidateQueries({
      queryKey: queryKeys.vehicles(tenantId, fleetId || undefined),
    });
  };

  const handleUpdate = async () => {
    if (!editVin) return;
    const tags = assetTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    await updateVehicle(editVin, {
      status: editStatus || undefined,
      assetTags: tags.length ? tags : undefined,
      metadata: parseJson(metadata),
    });
    setAssetTags("");
    setMetadata("");
    queryClient.invalidateQueries({
      queryKey: queryKeys.vehicles(tenantId, fleetId || undefined),
    });
  };

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Vehicles"
        subtitle="Register vehicles, manage status, and capture metadata."
      />
      <div className="split-layout">
        <Card title="Vehicle Actions">
          <div className="stack">
            <label className="form__field">
              <span>Tenant</span>
              <select
                className="select"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
              >
                <option value="">Choose tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="form__field">
              <span>Fleet</span>
              <input
                className="input"
                placeholder="Fleet ID"
                value={fleetId}
                onChange={(event) => setFleetId(event.target.value)}
              />
            </label>
            <div className="section">
              <div className="section__title">Create Vehicle</div>
              <div className="stack">
                <input
                  className="input"
                  placeholder="VIN"
                  value={vin}
                  onChange={(event) => setVin(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Make"
                  value={make}
                  onChange={(event) => setMake(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Year"
                  value={year}
                  onChange={(event) => setYear(event.target.value)}
                />
                <select
                  className="select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <button className="btn" onClick={handleCreate} disabled={!vin}>
                  Create Vehicle
                </button>
              </div>
            </div>
            <div className="section">
              <div className="section__title">Update Vehicle</div>
              <div className="stack">
                <select
                  className="select"
                  value={editVin}
                  onChange={(event) => setEditVin(event.target.value)}
                >
                  <option value="">Choose vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.vin} value={vehicle.vin}>
                      {vehicle.vin}
                    </option>
                  ))}
                </select>
                <select
                  className="select"
                  value={editStatus}
                  onChange={(event) => setEditStatus(event.target.value)}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
                <input
                  className="input"
                  placeholder="Asset Tags (comma-separated)"
                  value={assetTags}
                  onChange={(event) => setAssetTags(event.target.value)}
                />
                <textarea
                  className="textarea"
                  placeholder='Metadata JSON (optional) e.g. {"color": "black"}'
                  value={metadata}
                  onChange={(event) => setMetadata(event.target.value)}
                  rows={5}
                />
                <button
                  className="btn"
                  onClick={handleUpdate}
                  disabled={!editVin}
                >
                  Update Vehicle
                </button>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Vehicle Directory">
          {!tenantId || !fleetId ? (
            <p>Select a tenant and fleet to view vehicles.</p>
          ) : isLoading ? (
            <p>Loading vehicles...</p>
          ) : error ? (
            <p>Unable to load vehicles.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>VIN</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.vin}>
                    <td className="mono">{vehicle.vin}</td>
                    <td>{vehicle.make ?? "—"}</td>
                    <td>{vehicle.model ?? "—"}</td>
                    <td>{vehicle.year ?? "—"}</td>
                    <td>
                      <span
                        className={`badge badge--${
                          vehicle.status?.toLowerCase() ?? "active"
                        }`}
                      >
                        {vehicle.status ?? "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
