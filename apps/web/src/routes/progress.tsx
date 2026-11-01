import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { rootRoute } from "./__root";
import { useDashboard } from "../db/use-dashboard";
import { usePreferences } from "../db/preferences";
import { weeklySessions, weightPoints, moveDate } from "../lib/chart-data";
import { PageHeader } from "../components/layout/page-header";
import { InteractiveChart } from "../components/charts/interactive-chart";
import { ChartDetail, type Metric } from "../components/dashboard/chart-detail";
function Progress() {
  const { data, error, loading, now } = useDashboard();
  const { unit } = usePreferences();
  const [detail, setDetail] = useState<Metric | null>(null);
  const workouts = data?.workouts ?? [],
    weights = data?.weights ?? [];
  return (
    <div>
      <PageHeader title="Progress" />
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      <div className="progress-grid" aria-busy={loading}>
        <section className="overview-module">
          <button type="button" className="module-link" onClick={() => setDetail("training")}>
            <h2>Training consistency</h2>
            <ChevronRight size={19} />
          </button>
          <p className="metric-context">Completed sessions · Last 12 calendar weeks</p>
          {workouts.some((w) => w.status === "completed") ? (
            <InteractiveChart
              label="Weekly completed training sessions, 12 weeks"
              points={weeklySessions(workouts, 12, now)}
              series={[{ key: "sessions", label: "Completed", kind: "bar", unit: "sessions" }]}
              height={260}
              table
            />
          ) : (
            <div className="module-empty">
              <p>{loading ? "Loading training history…" : "No completed sessions yet."}</p>
            </div>
          )}
        </section>
        <section className="overview-module">
          <button type="button" className="module-link" onClick={() => setDetail("weight")}>
            <h2>Weight history</h2>
            <ChevronRight size={19} />
          </button>
          <p className="metric-context">Scale and trend · Last 12 weeks</p>
          <InteractiveChart
            label={`Scale and trend weight in ${unit}, 12 weeks`}
            points={weightPoints(weights, unit).filter(
              (p) => p.x >= moveDate(now, -83).setHours(0, 0, 0, 0) && p.x <= now.getTime(),
            )}
            series={[
              { key: "trend", label: "Trend", kind: "line", unit },
              { key: "scale", label: "Scale", kind: "point", unit },
            ]}
            height={260}
            table
          />
        </section>
      </div>
      <ChartDetail
        metric={detail}
        onClose={() => setDetail(null)}
        workouts={workouts}
        weights={weights}
        now={now}
      />
    </div>
  );
}
export const progressRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/progress",
  component: Progress,
});
