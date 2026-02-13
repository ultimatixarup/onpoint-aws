import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/adlp/dashboard", label: "Dashboard" },
  { to: "/adlp/tracking/live", label: "Live Tracking" },
  { to: "/adlp/tracking/trips", label: "Trip History" },
  { to: "/adlp/telemetry/raw", label: "Telemetry Raw" },
  { to: "/adlp/telemetry/normalized", label: "Telemetry Normalized" },
  { to: "/adlp/geofence/manage", label: "Geofence" },
  { to: "/adlp/geofence/setup", label: "Geofence Setup" },
  { to: "/adlp/vehicles/vin-summary", label: "Vehicles" },
  { to: "/adlp/drivers/dashboard", label: "Drivers" },
  { to: "/adlp/trips/planning", label: "Trips" },
  { to: "/adlp/reports", label: "Reports" },
];

const adminLinks = [
  { to: "/adlp/platform/dashboard", label: "Platform Dashboard" },
  { to: "/adlp/platform/tenants", label: "Tenants" },
  { to: "/adlp/platform/customers", label: "Customers" },
  { to: "/adlp/platform/fleets", label: "Fleets" },
  { to: "/adlp/platform/users", label: "Users" },
  { to: "/adlp/platform/drivers", label: "Drivers" },
  { to: "/adlp/platform/vehicles", label: "Vehicles" },
  { to: "/adlp/platform/vehicle-assignments", label: "Vehicle Assignments" },
  { to: "/adlp/platform/driver-assignments", label: "Driver Assignments" },
];

const tenantAdminLinks = [
  { to: "/adlp/users", label: "Users" },
  { to: "/adlp/groups", label: "Groups" },
  { to: "/adlp/config", label: "Configuration" },
  { to: "/adlp/notifications", label: "Notifications" },
];

export function Sidebar() {
  const { roles } = useAuth();
  const isPlatformAdmin = roles.includes("platform_admin");
  const isTenantAdmin = roles.includes("tenant_admin");
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isTenantAdminOpen, setIsTenantAdminOpen] = useState(true);
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        <div className="sidebar__section sidebar__section--root">
          <div className="sidebar__title">Navigation</div>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="sidebar__link">
              {link.label}
            </NavLink>
          ))}
        </div>
        {isTenantAdmin ? (
          <div className="sidebar__section">
            <button
              type="button"
              className="sidebar__toggle"
              onClick={() => setIsTenantAdminOpen((prev) => !prev)}
              aria-expanded={isTenantAdminOpen}
            >
              <span>Tenant Admin</span>
              <span className="sidebar__chevron">
                {isTenantAdminOpen ? "▾" : "▸"}
              </span>
            </button>
            {isTenantAdminOpen
              ? tenantAdminLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="sidebar__link">
                    {link.label}
                  </NavLink>
                ))
              : null}
          </div>
        ) : null}
        {isPlatformAdmin ? (
          <div className="sidebar__section">
            <button
              type="button"
              className="sidebar__toggle"
              onClick={() => setIsAdminOpen((prev) => !prev)}
              aria-expanded={isAdminOpen}
            >
              <span>Platform Admin</span>
              <span className="sidebar__chevron">
                {isAdminOpen ? "▾" : "▸"}
              </span>
            </button>
            {isAdminOpen
              ? adminLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="sidebar__link">
                    {link.label}
                  </NavLink>
                ))
              : null}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
