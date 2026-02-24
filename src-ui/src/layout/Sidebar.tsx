import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navSections = [
  {
    title: "Overview",
    icon: "◎",
    links: [{ to: "/adlp/dashboard", label: "Dashboard" }],
  },
  {
    title: "Dispatch",
    icon: "⚙",
    links: [
      { to: "/adlp/tracking/live", label: "Live Tracking" },
      { to: "/adlp/trips/planning", label: "Planning" },
      { to: "/adlp/tracking/trips", label: "Trip History" },
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
    title: "Drivers",
    icon: "▣",
    links: [
      { to: "/adlp/drivers/summary", label: "Drivers" },
      { to: "/adlp/drivers/dashboard", label: "Performance" },
      { to: "/adlp/drivers/assign", label: "Assignments" },
      { to: "/adlp/drivers/compliance", label: "Compliance" },
      { to: "/adlp/drivers/safety", label: "Safety" },
      { to: "/adlp/drivers/reports", label: "Driver Reports" },
    ],
  },
  {
    title: "Insights",
    icon: "●",
    links: [
      { to: "/adlp/reports", label: "Reports" },
      { to: "/adlp/telemetry/raw", label: "Telemetry" },
    ],
  },
  {
    title: "Settings",
    icon: "☰",
    links: [
      { to: "/adlp/settings/general", label: "Config" },
      { to: "/adlp/settings/notifications", label: "Notifications" },
      { to: "/adlp/settings/faq", label: "FAQ" },
    ],
  },
];

const adminLinks = [
  { to: "/adlp/platform/dashboard", label: "Dashboard" },
  { to: "/adlp/platform/tenants", label: "Tenants" },
  { to: "/adlp/platform/fleets", label: "Fleets" },
  { to: "/adlp/platform/users", label: "Users" },
  { to: "/adlp/platform/drivers", label: "Drivers" },
  { to: "/adlp/platform/vehicles", label: "Vehicles" },
  { to: "/adlp/platform/vehicle-assignments", label: "Vehicle Assign" },
  { to: "/adlp/platform/driver-assignments", label: "Driver Assign" },
  { to: "/adlp/platform/customers", label: "Customers" },
];

const tenantAdminLinks = [
  { to: "/adlp/tenant/drivers", label: "Drivers" },
  { to: "/adlp/tenant/vehicles", label: "Vehicles" },
  { to: "/adlp/users", label: "Users" },
  { to: "/adlp/groups", label: "Groups" },
];

const OPEN_SECTIONS_STORAGE_KEY = "onpoint.sidebar.openSections";
const OPEN_ADMIN_STORAGE_KEY = "onpoint.sidebar.openAdmin";
const OPEN_TENANT_ADMIN_STORAGE_KEY = "onpoint.sidebar.openTenantAdmin";

function readStoredBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return fallback;
}

function sectionHasPath(
  section: (typeof navSections)[number],
  pathname: string,
): boolean {
  return section.links.some((link) => pathname.startsWith(link.to));
}

export function Sidebar() {
  const location = useLocation();
  const { roles } = useAuth();
  const isPlatformAdmin = roles.includes("platform_admin");
  const isTenantAdmin = roles.includes("tenant_admin");

  const activeSectionTitle = useMemo(() => {
    const match = navSections.find((section) =>
      sectionHasPath(section, location.pathname),
    );
    return match?.title;
  }, [location.pathname]);

  const [isAdminOpen, setIsAdminOpen] = useState(() =>
    readStoredBoolean(
      OPEN_ADMIN_STORAGE_KEY,
      location.pathname.startsWith("/adlp/platform"),
    ),
  );
  const [isTenantAdminOpen, setIsTenantAdminOpen] = useState(() =>
    readStoredBoolean(
      OPEN_TENANT_ADMIN_STORAGE_KEY,
      location.pathname.startsWith("/adlp/tenant") ||
        location.pathname.startsWith("/adlp/users") ||
        location.pathname.startsWith("/adlp/groups"),
    ),
  );
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () => {
      const defaults = Object.fromEntries(
        navSections.map((section) => [
          section.title,
          section.title === "Overview",
        ]),
      ) as Record<string, boolean>;

      if (activeSectionTitle) {
        defaults[activeSectionTitle] = true;
      }

      if (typeof window === "undefined") return defaults;
      const raw = window.localStorage.getItem(OPEN_SECTIONS_STORAGE_KEY);
      if (!raw) return defaults;
      try {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        return { ...defaults, ...parsed };
      } catch {
        return defaults;
      }
    },
  );

  useEffect(() => {
    if (!activeSectionTitle) return;
    setOpenSections((prev) => ({ ...prev, [activeSectionTitle]: true }));
  }, [activeSectionTitle]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      OPEN_SECTIONS_STORAGE_KEY,
      JSON.stringify(openSections),
    );
  }, [openSections]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(OPEN_ADMIN_STORAGE_KEY, String(isAdminOpen));
  }, [isAdminOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      OPEN_TENANT_ADMIN_STORAGE_KEY,
      String(isTenantAdminOpen),
    );
  }, [isTenantAdminOpen]);

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
              <span>Tenant Setup</span>
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
              <span>Platform Ops</span>
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
