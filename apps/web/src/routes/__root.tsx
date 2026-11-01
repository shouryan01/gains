import { createRootRoute, Link } from "@tanstack/react-router";
import { AppShell } from "../components/layout/app-shell";
import { PreferencesProvider } from "../db/preferences";
export const rootRoute = createRootRoute({
  component: () => (
    <PreferencesProvider>
      <AppShell />
    </PreferencesProvider>
  ),
  notFoundComponent: () => (
    <div className="empty-state">
      <h1>Page not found</h1>
      <Link to="/">Back to Overview</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="empty-state" role="alert">
      <h1>Something went wrong</h1>
      <p>{error instanceof Error ? error.message : String(error)}</p>
      <a href="/">Reload Gains</a>
    </div>
  ),
});
