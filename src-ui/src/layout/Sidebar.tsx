import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navSections = [
  {
    title: "Overview",
    icon: "◎",
    links: [{ to: "/adlp/dashboard", label: "Dashboard" }],
  },
  {
    title: "Operations",
    icon: "⚙",
    links: [
      { to: "/adlp/tracking/live", label: "Live Tracking" },
      { to: "/adlp/tracking/trips", label: "Trip History" },
      { to: "/adlp/trips/planning", label: "Trip Planning" },
    ],
  },
  {
    title: "Drivers",
    icon: "▣",
    links: [
      { to: "/adlp/drivers/summary", label: "Driver Directory" },
      { to: "/adlp/drivers/dashboard", label: "Driver Dashboard" },
      { to: "/adlp/drivers/assign", label: "Assignments" },
      { to: "/adlp/drivers/compliance", label: "Compliance" },
      { to: "/adlp/drivers/safety", label: "Safety Analytics" },
      { to: "/adlp/drivers/reports", label: "Reports" },
    ],
  },
  {
    title: "Fleet",
    icon: "◆",
    links: [
      { to: "/adlp/vehicles/vin-summary", label: "Vehicles" },
      { to: "/adlp/geofence/manage", label: "Geofence" },
      { to: "/adlp/geofence/setup", label: "Geofence Setup" },
    ],
  },
  {
    title: "Telemetry",
    icon: "◇",
    links: [{ to: "/adlp/telemetry/raw", label: "Telemetry Events" }],
  },
  {
    title: "Reports",
    icon: "●",
    links: [{ to: "/adlp/reports", label: "Fleet Reports" }],
  },
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
  { to: "/adlp/tenant/drivers", label: "Drivers" },
  { to: "/adlp/tenant/vehicles", label: "Vehicles" },
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
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(navSections.map((section) => [section.title, true])),
  );
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {navSections.map((section) => {
          const isOpen = openSections[section.title];
          const sectionId = `nav-section-${section.title
            .toLowerCase()
            .replace(/\s+/g, "-")}`;
          return (
            <div
              key={section.title}
              className="sidebar__section sidebar__section--root"
            >
              <button
                type="button"
                className="sidebar__section-toggle"
                aria-expanded={isOpen}
                aria-controls={sectionId}
                onClick={() =>
                  setOpenSections((prev) => ({
                    ...prev,
                    [section.title]: !prev[section.title],
                  }))
                }
              >
                <span className="sidebar__section-title">
                  <span className="sidebar__section-icon" aria-hidden="true">
                    {section.icon}
                  </span>
                  {section.title}
                </span>
                <span className="sidebar__chevron">{isOpen ? "▾" : "▸"}</span>
              </button>
              {isOpen ? (
                <div id={sectionId} className="sidebar__section-links">
                  {section.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className="sidebar__link"
                    >
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {isTenantAdmin ? (
          <div className="sidebar__section">
            <button
              type="button"
              className="sidebar__toggle"
              onClick={() => setIsTenantAdminOpen((prev) => !prev)}
              aria-expanded={isTenantAdminOpen}
              aria-controls="nav-section-tenant-admin"
            >
              <span>Tenant Admin</span>
              <span className="sidebar__chevron">
                {isTenantAdminOpen ? "▾" : "▸"}
              </span>
            </button>
            {isTenantAdminOpen ? (
              <div
                id="nav-section-tenant-admin"
                className="sidebar__section-links"
              >
                {tenantAdminLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="sidebar__link">
                    {link.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
        {isPlatformAdmin ? (
          <div className="sidebar__section">
            <button
              type="button"
              className="sidebar__toggle"
              onClick={() => setIsAdminOpen((prev) => !prev)}
              aria-expanded={isAdminOpen}
              aria-controls="nav-section-platform-admin"
            >
              <span>Platform Admin</span>
              <span className="sidebar__chevron">
                {isAdminOpen ? "▾" : "▸"}
              </span>
            </button>
            {isAdminOpen ? (
              <div
                id="nav-section-platform-admin"
                className="sidebar__section-links"
              >
                {adminLinks.map((link) => (
                  <NavLink key={link.to} to={link.to} className="sidebar__link">
                    {link.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
