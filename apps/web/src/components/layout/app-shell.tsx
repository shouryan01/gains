import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ChartNoAxesCombined, Dumbbell, LayoutDashboard, Settings2, Utensils } from "lucide-react";
import { useStorageStatus } from "./demo-banner";
const navigation = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/train", label: "Train", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Utensils },
  { to: "/progress", label: "Progress", icon: ChartNoAxesCombined },
] as const;
export function AppShell() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const { status, error } = useStorageStatus();
  const trainActive = ["/train", "/routines", "/exercises"].includes(path);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand" aria-label="Gains overview">
          gains
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <div key={to}>
              <Link
                to={to}
                activeOptions={{ exact: true }}
                className={`nav-link ${to === "/train" && trainActive ? "is-active" : ""}`}
                title={label}
              >
                <Icon size={21} />
                <span>{label}</span>
              </Link>
              {to === "/train" && (
                <div className="sub-navigation">
                  <Link to="/routines" className="nav-link">
                    Routines
                  </Link>
                  <Link to="/exercises" className="nav-link">
                    Exercises
                  </Link>
                </div>
              )}
            </div>
          ))}
        </nav>
        <Link to="/settings" className="nav-link sidebar-settings" title="Settings">
          <Settings2 size={21} />
          <span>Settings</span>
        </Link>
      </aside>
      <div className="app-content">
        <main id="main-content">
          {(error || status?.mode === "memory") && (
            <div className="storage-notice" role="status">
              <strong>{error ? "Database unavailable" : "Temporary storage"}</strong>
              <span>
                {error ??
                  "Persistent storage is unavailable. Changes in this tab will be lost on reload or close. Close other Gains tabs and reload to retry."}
              </span>
              <Link to="/settings">Storage details</Link>
            </div>
          )}
          <Outlet />
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className={to === "/train" && trainActive ? "is-active" : undefined}
          >
            <Icon size={24} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
