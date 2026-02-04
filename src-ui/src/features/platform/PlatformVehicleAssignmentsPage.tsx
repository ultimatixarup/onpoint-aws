import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import {
  assignVin,
  fetchFleets,
  fetchTenants,
  fetchVehicles,
  fetchVehicleAssignments,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";

export function PlatformVehicleAssignmentsPage() {
  const [vin, setVin] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [fleetId, setFleetId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [reason, setReason] = useState("");

  const {
    data: tenants = [],
    isLoading: isLoadingTenants,
    error: tenantsError,
  } = useQuery({
    queryKey: queryKeys.tenants(undefined, true),
    queryFn: () => fetchTenants({ isAdmin: true }),
  });

  const {
    data: fleets = [],
    isLoading: isLoadingFleets,
    error: fleetsError,
  } = useQuery({
    queryKey: tenantId ? queryKeys.fleets(tenantId) : ["fleets", "none"],
    queryFn: () => fetchFleets(tenantId),
    enabled: Boolean(tenantId),
  });

  const {
    data: vehicles = [],
    isLoading: isLoadingVehicles,
    error: vehiclesError,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId || undefined)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId || undefined),
    enabled: Boolean(tenantId),
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: vin
      ? ["vehicle-assignments", vin, tenantId]
      : ["vehicle-assignments", "none"],
    queryFn: () => fetchVehicleAssignments(vin, tenantId || undefined),
    enabled: Boolean(vin),
  });

  const handleAssign = async () => {
    if (!vin || !tenantId || !effectiveFrom || !reason) return;
    const idempotencyKey = crypto.randomUUID();
    await assignVin(
      {
        vin,
        tenantId,
        fleetId: fleetId || undefined,
        customerId: customerId || undefined,
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
        reason,
      },
      idempotencyKey,
    );
    setReason("");
    refetch();
  };

  const assignmentItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Vehicle Assignment"
        subtitle="Assign vehicles to tenants or fleets and review history."
      />
      <div className="split-layout">
        <Card title="Assignment Actions">
          <div className="stack">
            <label className="form__field">
              <span>Tenant</span>
              <select
                className="select"
                value={tenantId}
                onChange={(event) => {
                  setTenantId(event.target.value);
                  setFleetId("");
                  setVin("");
                }}
                disabled={isLoadingTenants || Boolean(tenantsError)}
              >
                <option value="">Choose tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              {tenantsError ? (
                <span className="text-muted">Unable to load tenants.</span>
              ) : null}
            </label>
            <label className="form__field">
              <span>Fleet</span>
              <select
                className="select"
                value={fleetId}
                onChange={(event) => {
                  setFleetId(event.target.value);
                  setVin("");
                }}
                disabled={!tenantId || isLoadingFleets || Boolean(fleetsError)}
              >
                <option value="">Choose fleet (optional)</option>
                {fleets.map((fleet) => (
                  <option key={fleet.fleetId} value={fleet.fleetId}>
                    {fleet.name ?? fleet.fleetId}
                  </option>
                ))}
              </select>
              {fleetsError ? (
                <span className="text-muted">Unable to load fleets.</span>
              ) : null}
            </label>
            <label className="form__field">
              <span>VIN</span>
              <select
                className="select"
                value={vin}
                onChange={(event) => setVin(event.target.value)}
                disabled={
                  !tenantId || isLoadingVehicles || Boolean(vehiclesError)
                }
              >
                <option value="">Choose vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vin} value={vehicle.vin}>
                    {vehicle.vin}
                  </option>
                ))}
              </select>
              {vehiclesError ? (
                <span className="text-muted">Unable to load vehicles.</span>
              ) : null}
            </label>
            <label className="form__field">
              <span>Customer ID</span>
              <input
                className="input"
                placeholder="Optional"
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Effective From (ISO)</span>
              <input
                className="input"
                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                value={effectiveFrom}
                onChange={(event) => setEffectiveFrom(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Effective To (ISO)</span>
              <input
                className="input"
                placeholder="Optional"
                value={effectiveTo}
                onChange={(event) => setEffectiveTo(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Reason</span>
              <input
                className="input"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <button
              className="btn"
              onClick={handleAssign}
              disabled={!vin || !tenantId || !effectiveFrom || !reason}
            >
              Assign Vehicle
            </button>
          </div>
        </Card>
        <Card title="Assignment History">
          {!vin ? (
            <p>Select a vehicle to view assignments.</p>
          ) : isLoading ? (
            <p>Loading assignments...</p>
          ) : error ? (
            <p>Unable to load assignments.</p>
          ) : assignmentItems.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Fleet</th>
                  <th>Customer</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                </tr>
              </thead>
              <tbody>
                {assignmentItems.map((item, index) => (
                  <tr key={item.assignmentId ?? `${item.vin}-${index}`}>
                    <td className="mono">{item.tenantId ?? "—"}</td>
                    <td className="mono">{item.fleetId ?? "—"}</td>
                    <td className="mono">{item.customerId ?? "—"}</td>
                    <td>{item.effectiveFrom ?? "—"}</td>
                    <td>{item.effectiveTo ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="code-block">{JSON.stringify(data, null, 2)}</pre>
          )}
        </Card>
      </div>
    </div>
  );
}
