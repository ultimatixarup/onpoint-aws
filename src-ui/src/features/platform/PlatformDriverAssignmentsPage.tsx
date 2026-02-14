import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
    createDriverAssignment,
    type DriverAssignment,
    fetchDriverAssignments,
    fetchDrivers,
    fetchFleets,
    fetchTenants,
    fetchVehicles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { Card } from "../../ui/Card";

export function PlatformDriverAssignmentsPage() {
  const [driverId, setDriverId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [fleetId, setFleetId] = useState("");
  const [vin, setVin] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
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

  const {
    data: drivers = [],
    isLoading: isLoadingDrivers,
    error: driversError,
  } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId || undefined)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId, fleetId || undefined),
    enabled: Boolean(tenantId),
  });

  const { data = [], isLoading, error, refetch } = useQuery<
    DriverAssignment[]
  >({
    queryKey: driverId
      ? ["driver-assignments", driverId, tenantId]
      : ["driver-assignments", "none"],
    queryFn: () => fetchDriverAssignments(tenantId, driverId),
    enabled: Boolean(driverId && tenantId),
  });

  const handleAssign = async () => {
    if (!driverId || !tenantId || !vin || !effectiveFrom) return;
    const idempotencyKey = crypto.randomUUID();
    await createDriverAssignment(
      driverId,
      {
        tenantId,
        vin,
        effectiveFrom,
        effectiveTo: effectiveTo || undefined,
        assignmentType: assignmentType || undefined,
        reason: reason || undefined,
      },
      idempotencyKey,
    );
    setReason("");
    refetch();
  };

  const assignmentItems = data;

  return (
    <div className="page platform-page">
      <section className="platform-hero">
        <div className="platform-hero__glow" />
        <div>
          <p className="platform-hero__eyebrow">Administration</p>
          <h1>Platform Admin – Driver Assignment</h1>
          <p className="platform-hero__subtitle">
            Assign drivers to vehicles and review assignment history.
          </p>
        </div>
      </section>
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
                  setDriverId("");
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
                  setDriverId("");
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
              <span>Driver</span>
              <select
                className="select"
                value={driverId}
                onChange={(event) => setDriverId(event.target.value)}
                disabled={
                  !tenantId || isLoadingDrivers || Boolean(driversError)
                }
              >
                <option value="">Choose driver</option>
                {drivers.map((driver) => (
                  <option key={driver.driverId} value={driver.driverId}>
                    {driver.name
                      ? `${driver.name} (${driver.driverId})`
                      : driver.driverId}
                  </option>
                ))}
              </select>
              {driversError ? (
                <span className="text-muted">Unable to load drivers.</span>
              ) : null}
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
              <span>Assignment Type</span>
              <input
                className="input"
                placeholder="Optional"
                value={assignmentType}
                onChange={(event) => setAssignmentType(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Reason</span>
              <input
                className="input"
                placeholder="Optional"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <button
              className="btn"
              onClick={handleAssign}
              disabled={!driverId || !tenantId || !vin || !effectiveFrom}
            >
              Assign Driver
            </button>
          </div>
        </Card>
        <Card title="Assignment History">
          {!driverId ? (
            <p>Select a driver to view assignments.</p>
          ) : isLoading ? (
            <p>Loading assignments...</p>
          ) : error ? (
            <p>Unable to load assignments.</p>
          ) : assignmentItems.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>VIN</th>
                  <th>Type</th>
                  <th>Effective From</th>
                  <th>Effective To</th>
                </tr>
              </thead>
              <tbody>
                {assignmentItems.map((item, index) => (
                  <tr key={item.assignmentId ?? `${item.driverId}-${index}`}>
                    <td className="mono">{item.tenantId ?? "—"}</td>
                    <td className="mono">{item.vin ?? "—"}</td>
                    <td>{item.assignmentType ?? "—"}</td>
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
