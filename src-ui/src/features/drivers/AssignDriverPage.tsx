import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  createDriverAssignment,
  fetchDrivers,
  fetchVehicles,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { createIdempotencyKey } from "../../utils/id";

export function AssignDriverPage() {
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const [searchParams] = useSearchParams();
  const tenantId = tenant?.id ?? "";
  const fleetId = fleet?.id;
  const presetDriverId = searchParams.get("driverId") ?? "";

  const [driverId, setDriverId] = useState(presetDriverId);
  const [vin, setVin] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [assignmentType, setAssignmentType] = useState("PRIMARY");
  const [reason, setReason] = useState("Shift assignment");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: drivers = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.drivers(tenantId, fleetId)
      : ["drivers", "none"],
    queryFn: () => fetchDrivers(tenantId, fleetId),
    enabled: Boolean(tenantId),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: tenantId
      ? queryKeys.vehicles(tenantId, fleetId)
      : ["vehicles", "none"],
    queryFn: () => fetchVehicles(tenantId, fleetId),
    enabled: Boolean(tenantId),
  });

  const vehicleOptions = useMemo(
    () => vehicles.map((vehicle) => vehicle.vin),
    [vehicles],
  );

  const handleSubmit = async () => {
    if (!tenantId) {
      setError("Select a tenant to continue.");
      return;
    }
    if (!driverId) {
      setError("Select a driver.");
      return;
    }
    if (!vin) {
      setError("Select a VIN.");
      return;
    }
    if (!effectiveFrom) {
      setError("Effective start is required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await createDriverAssignment(
        driverId,
        {
          tenantId,
          vin,
          effectiveFrom: new Date(effectiveFrom).toISOString(),
          effectiveTo: effectiveTo
            ? new Date(effectiveTo).toISOString()
            : undefined,
          assignmentType,
          reason,
        },
        createIdempotencyKey(),
      );
      setStatus("Assignment created.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign driver.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Assign Driver"
        subtitle="Attach a driver to a vehicle with effective dates."
      />
      <Card title="Assignment details">
        {status ? <div className="form-success">{status}</div> : null}
        {error ? <div className="form-error">{error}</div> : null}
        <div className="form-grid">
          <label className="form__field">
            <span className="text-muted">Driver</span>
            <select
              className="select"
              value={driverId}
              onChange={(event) => setDriverId(event.target.value)}
            >
              <option value="">Choose driver</option>
              {drivers.map((driver) => (
                <option key={driver.driverId} value={driver.driverId}>
                  {driver.name ?? driver.displayName ?? driver.driverId}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">VIN</span>
            <select
              className="select"
              value={vin}
              onChange={(event) => setVin(event.target.value)}
            >
              <option value="">Choose vehicle</option>
              {vehicleOptions.map((vehicleVin) => (
                <option key={vehicleVin} value={vehicleVin}>
                  {vehicleVin}
                </option>
              ))}
            </select>
          </label>
          <label className="form__field">
            <span className="text-muted">Effective from</span>
            <input
              className="input"
              type="datetime-local"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Effective to</span>
            <input
              className="input"
              type="datetime-local"
              value={effectiveTo}
              onChange={(event) => setEffectiveTo(event.target.value)}
            />
          </label>
          <label className="form__field">
            <span className="text-muted">Assignment type</span>
            <select
              className="select"
              value={assignmentType}
              onChange={(event) => setAssignmentType(event.target.value)}
            >
              <option value="PRIMARY">PRIMARY</option>
              <option value="SECONDARY">SECONDARY</option>
              <option value="TEMPORARY">TEMPORARY</option>
            </select>
          </label>
          <label className="form__field form__field--full">
            <span className="text-muted">Reason</span>
            <input
              className="input"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        </div>
        <div className="form__actions">
          <button
            className="btn"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Assign driver"}
          </button>
        </div>
      </Card>
    </div>
  );
}
