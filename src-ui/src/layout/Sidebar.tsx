import { NavLink } from "react-router-dom";

const links = [
  { to: "/adlp/dashboard", label: "Dashboard" },
  { to: "/adlp/tracking/live", label: "Live Tracking" },
  { to: "/adlp/tracking/trips", label: "Trip History" },
  { to: "/adlp/telemetry/raw", label: "Telemetry Raw" },
  { to: "/adlp/telemetry/normalized", label: "Telemetry Normalized" },
  { to: "/adlp/geofence/manage", label: "Geofence" },
  { to: "/adlp/vehicles/vin-summary", label: "Vehicles" },
  { to: "/adlp/drivers/dashboard", label: "Drivers" },
  { to: "/adlp/trips/planning", label: "Trips" },
  { to: "/adlp/reports", label: "Reports" }
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} className="sidebar__link">
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
