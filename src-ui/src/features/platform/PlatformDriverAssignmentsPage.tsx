import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import {
  createDriverAssignment,
  fetchDriverAssignments,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";

export function PlatformDriverAssignmentsPage() {
  const [driverId, setDriverId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [vin, setVin] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: driverId
      ? queryKeys.driverAssignments(driverId)
      : ["driver-assignments", "none"],
    queryFn: () => fetchDriverAssignments(driverId),
    enabled: Boolean(driverId),
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

  const assignmentItems = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];

  return (
    <div className="page">
      <PageHeader
        title="Platform Admin – Driver Assignment"
        subtitle="Assign drivers to vehicles and review assignment history."
      />
      <div className="split-layout">
        <Card title="Assignment Actions">
          <div className="stack">
            <label className="form__field">
              <span>Driver ID</span>
              <input
                className="input"
                value={driverId}
                onChange={(event) => setDriverId(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>Tenant ID</span>
              <input
                className="input"
                value={tenantId}
                onChange={(event) => setTenantId(event.target.value)}
              />
            </label>
            <label className="form__field">
              <span>VIN</span>
              <input
                className="input"
                value={vin}
                onChange={(event) => setVin(event.target.value)}
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
            <p>Enter a driver ID to view assignments.</p>
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
