import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  fetchDriverAssignments,
  fetchDriverDetail,
  DriverAssignment,
} from "../../api/onpointApi";
import { queryKeys } from "../../api/queryKeys";
import { useFleet } from "../../context/FleetContext";
import { useTenant } from "../../context/TenantContext";
import { Card } from "../../ui/Card";
import { PageHeader } from "../../ui/PageHeader";
import { formatDate } from "../../utils/date";

function assignmentStatus(assignment: DriverAssignment) {
  if (!assignment.effectiveFrom && !assignment.effectiveTo) return "Unknown";
  const now = new Date();
  const from = assignment.effectiveFrom
    ? new Date(assignment.effectiveFrom)
    : undefined;
  const to = assignment.effectiveTo
    ? new Date(assignment.effectiveTo)
    : undefined;
  if (from && now < from) return "Upcoming";
  if (to && now > to) return "Ended";
  return "Active";
}

export function DriverProfilePage() {
  const { driverId } = useParams();
  const { tenant } = useTenant();
  const { fleet } = useFleet();
  const tenantId = tenant?.id;
  const fleetId = fleet?.id;

  const {
    data: driver,
    isLoading: isLoadingDriver,
    error: driverError,
  } = useQuery({
    queryKey:
      tenantId && driverId
        ? queryKeys.driverDetail(tenantId, driverId)
        : ["driver", "none"],
    queryFn: () => fetchDriverDetail(tenantId ?? "", driverId ?? ""),
    enabled: Boolean(tenantId && driverId),
  });

  const {
    data: assignments = [],
    isLoading: isLoadingAssignments,
    error: assignmentsError,
  } = useQuery({
    queryKey: driverId
      ? queryKeys.driverAssignments(driverId)
      : ["driver-assignments", "none"],
    queryFn: () => fetchDriverAssignments(tenantId ?? "", driverId ?? ""),
    enabled: Boolean(tenantId && driverId),
  });

  if (!driverId) {
    return (
      <div className="page">
        <PageHeader
          title="Driver profile"
          subtitle="Select a driver from the roster."
        />
      </div>
    );
  }

  return (
    <div className="page driver-profile">
      <PageHeader
        title={driver?.displayName ?? driver?.name ?? "Driver profile"}
        subtitle={driver?.driverId ? `ID: ${driver.driverId}` : undefined}
      />

      <div className="driver-profile__actions">
        <Link
          className="btn btn--secondary"
          to={`/adlp/drivers/${driverId}/dashboard`}
        >
          View dashboard
        </Link>
        <Link className="btn" to={`/adlp/drivers/assign?driverId=${driverId}`}>
          Assign driver
        </Link>
      </div>

      <div className="driver-profile__grid">
        <Card title="Contact">
          {isLoadingDriver ? (
            <div className="empty-state">Loading driver details...</div>
          ) : driverError ? (
            <div className="empty-state">Unable to load driver.</div>
          ) : driver ? (
            <div className="detail-grid">
              <div>
                <span className="text-muted">Email</span>
                <strong>{driver.email ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">Phone</span>
                <strong>{driver.phone ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">Fleet</span>
                <strong>{driver.fleetId ?? fleetId ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">Customer</span>
                <strong>{driver.customerId ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">Status</span>
                <strong>{driver.status ?? "Unknown"}</strong>
              </div>
              <div>
                <span className="text-muted">Created</span>
                <strong>{formatDate(driver.createdAt)}</strong>
              </div>
              <div>
                <span className="text-muted">Updated</span>
                <strong>{formatDate(driver.updatedAt)}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">Driver not found.</div>
          )}
        </Card>

        <Card title="Compliance & credentials">
          {driver ? (
            <div className="detail-grid">
              <div>
                <span className="text-muted">Employee ID</span>
                <strong>{driver.employeeId ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">External ref</span>
                <strong>{driver.externalRef ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">License</span>
                <strong>
                  {driver.license && typeof driver.license === "object"
                    ? JSON.stringify(driver.license)
                    : "--"}
                </strong>
              </div>
              <div>
                <span className="text-muted">Medical cert expires</span>
                <strong>{formatDate(driver.medicalCertExpiresAt)}</strong>
              </div>
              <div>
                <span className="text-muted">Risk category</span>
                <strong>{driver.riskCategory ?? "--"}</strong>
              </div>
              <div>
                <span className="text-muted">DQ status</span>
                <strong>{driver.dqStatus ?? "--"}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-state">No compliance data.</div>
          )}
        </Card>
      </div>

      <Card title="Assignments">
        {isLoadingAssignments ? (
          <div className="empty-state">Loading assignments...</div>
        ) : assignmentsError ? (
          <div className="empty-state">Unable to load assignments.</div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">No assignments yet.</div>
        ) : (
          <div className="assignment-list">
            {assignments.map((assignment, index) => (
              <div
                key={`${assignment.vin}-${index}`}
                className="assignment-row"
              >
                <div>
                  <strong>{assignment.vin}</strong>
                  <div className="text-muted">
                    {assignment.assignmentType ?? "PRIMARY"}
                  </div>
                </div>
                <div>
                  <div className="text-muted">Effective</div>
                  <div>
                    {formatDate(assignment.effectiveFrom)} -
                    {formatDate(assignment.effectiveTo, "Present")}
                  </div>
                </div>
                <div className="assignment-row__status">
                  {assignmentStatus(assignment)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
