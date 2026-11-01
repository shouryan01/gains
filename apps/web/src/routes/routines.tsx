import { createRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { rootRoute } from "./__root";
import { useRoutines, RoutineRows } from "./train";
import { PageHeader } from "../components/layout/page-header";
function Routines() {
  const { data, error, loading } = useRoutines();
  return (
    <div>
      <PageHeader title="Routines" />
      <Link to="/train" className="back-link">
        <ArrowLeft size={16} />
        Train
      </Link>
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      <section className="overview-module routine-page">
        {loading ? (
          <p className="muted">Loading routines…</p>
        ) : data?.length ? (
          <RoutineRows routines={data} />
        ) : (
          <div className="module-empty">
            <h2>No routines saved</h2>
            <Link to="/settings" className="text-link">
              Load demo data
            </Link>
          </div>
        )}
      </section>
      <p className="release-note">The routine builder arrives in v0.3.</p>
    </div>
  );
}
export const routinesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/routines",
  component: Routines,
});
