import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Check,
  ChevronRight,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { rootRoute } from "./__root";
import { useDashboard } from "../db/use-dashboard";
import { displayWeight, usePreferences, type OverviewSection } from "../db/preferences";
import { defaultOverviewOrder } from "../db/preference-values";
import { moveDate, startOfWeek, weeklySessions, weightPoints } from "../lib/chart-data";
import { PageHeader } from "../components/layout/page-header";
import { InteractiveChart } from "../components/charts/interactive-chart";
import { NutritionSummary } from "../components/dashboard/nutrition-summary";
import { ChartDetail, type Metric } from "../components/dashboard/chart-detail";
import { Button } from "../components/ui/button";
function Home() {
  const { data, now, loading, error } = useDashboard();
  const { unit, overviewOrder, saving, error: preferenceError, setPreference } = usePreferences();
  const [editing, setEditing] = useState(false);
  const [detail, setDetail] = useState<Metric | null>(null);
  const workouts = data?.workouts ?? [];
  const completed = workouts.filter(
    (w) => w.status === "completed" && w.started_at <= now.getTime(),
  );
  const training = weeklySessions(completed, 4, now);
  const thisWeek = completed.filter((w) => w.started_at >= startOfWeek(now).getTime()).length;
  const recentWeights = (data?.weights ?? []).filter(
    (w) =>
      new Date(`${w.date}T00:00:00`).getTime() >= moveDate(now, -29).setHours(0, 0, 0, 0) &&
      new Date(`${w.date}T00:00:00`).getTime() <= now.getTime(),
  );
  const weights = weightPoints(recentWeights, unit);
  const scales = recentWeights.filter((w) => w.scale_weight_lb != null);
  const latest = scales.at(-1);
  const change =
    latest && scales.length > 1 ? latest.scale_weight_lb! - scales[0]!.scale_weight_lb! : null;
  const moveSection = async (section: OverviewSection, direction: number) => {
    const order = [...overviewOrder],
      index = order.indexOf(section),
      next = index + direction;
    if (next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next]!, order[index]!];
    await setPreference({ overviewOrder: order });
  };
  const titles = { training: "Training", weight: "Weight", nutrition: "Nutrition" };
  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={now.toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      >
        <button
          type="button"
          className="icon-button"
          onClick={() => setEditing(!editing)}
          aria-label={editing ? "Finish editing overview" : "Edit overview"}
          aria-pressed={editing}
        >
          {editing ? <Check size={21} /> : <SlidersHorizontal size={21} />}
        </button>
      </PageHeader>
      {(error || preferenceError) && (
        <p className="error" role="alert">
          {error?.message ?? preferenceError}
        </p>
      )}
      {editing && (
        <div className="overview-edit-bar">
          <span>Arrange your overview</span>
          <Button
            variant="ghost"
            disabled={saving}
            onClick={() => {
              void setPreference({ overviewOrder: defaultOverviewOrder });
            }}
          >
            <RotateCcw size={16} />
            Restore defaults
          </Button>
        </div>
      )}
      {loading ? (
        <div className="overview-grid" aria-busy="true" aria-label="Loading overview">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`skeleton-panel ${i === 0 ? "overview-lead" : ""}`}>
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : (
        <div className="overview-grid">
          {overviewOrder.map((section, i) => (
            <section
              key={section}
              className={`overview-module module-${section} ${i === 0 ? "overview-lead" : ""}`}
              aria-label={`${titles[section]} summary`}
            >
              {editing && (
                <div className="module-order">
                  <span className="muted small">Position {i + 1}</span>
                  <div>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${titles[section]} up`}
                      disabled={saving || i === 0}
                      onClick={() => {
                        void moveSection(section, -1);
                      }}
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Move ${titles[section]} down`}
                      disabled={saving || i === overviewOrder.length - 1}
                      onClick={() => {
                        void moveSection(section, 1);
                      }}
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>
                </div>
              )}
              <div className="module-heading">
                {section === "nutrition" ? (
                  <Link to="/nutrition" className="module-link">
                    <h2>Nutrition</h2>
                    <ChevronRight size={19} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="module-link"
                    onClick={() => setDetail(section)}
                    aria-label={`Open ${titles[section]} chart details`}
                  >
                    <h2>{titles[section]}</h2>
                    <ChevronRight size={19} />
                  </button>
                )}
              </div>
              {section === "training" &&
                (completed.length ? (
                  <>
                    <div className="metric-row">
                      <div className="metric-value">
                        {thisWeek}
                        <small>sessions</small>
                      </div>
                      <span className="muted small">This week</span>
                    </div>
                    <p className="metric-context">Last 4 calendar weeks</p>
                    <InteractiveChart
                      label="Completed training sessions over the last four weeks"
                      points={training}
                      series={[
                        { key: "sessions", label: "Completed", unit: "sessions", kind: "bar" },
                      ]}
                    />
                  </>
                ) : (
                  <div className="module-empty">
                    <h3>No completed sessions yet</h3>
                    <p>Load the sample training history in Settings.</p>
                    <Link to="/settings" className="text-link">
                      Demo data <ArrowRight size={16} />
                    </Link>
                  </div>
                ))}
              {section === "weight" && (
                <>
                  <div className="metric-row">
                    <div className="metric-value">
                      {latest ? displayWeight(latest.scale_weight_lb!, unit) : "—"}
                      <small>{unit}</small>
                    </div>
                    {change != null && (
                      <span className="muted small">
                        {change > 0 ? "+" : ""}
                        {displayWeight(change, unit)} {unit}
                        <br />
                        Last 30 days
                      </span>
                    )}
                  </div>
                  <InteractiveChart
                    label={`Scale and trend weight in ${unit}, last 30 days`}
                    points={weights}
                    series={[
                      { key: "trend", label: "Trend", kind: "line", unit },
                      { key: "scale", label: "Scale", kind: "point", unit },
                    ]}
                    height={150}
                    empty="No weight measurements in the last 30 days."
                  />
                </>
              )}
              {section === "nutrition" && (
                <>
                  <NutritionSummary day={data?.nutrition} context="Today" />
                </>
              )}
            </section>
          ))}
        </div>
      )}
      {completed.length > 0 && (
        <section className="recent-sessions">
          <div className="section-heading">
            <h2>Recent sessions</h2>
            <Link to="/train" className="text-link">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="session-list">
            {completed.slice(0, 3).map((workout) => (
              <div className="session-row" key={workout.id}>
                <div>
                  <strong>{workout.name}</strong>
                  <p>
                    {new Date(workout.started_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                    {workout.duration_seconds != null &&
                      ` · ${Math.round(workout.duration_seconds / 60)} min`}{" "}
                    · {workout.total_sets} sets
                  </p>
                </div>
                <span className="session-status">Completed</span>
              </div>
            ))}
          </div>
        </section>
      )}
      <ChartDetail
        metric={detail}
        onClose={() => setDetail(null)}
        workouts={completed}
        weights={data?.weights ?? []}
        now={now}
      />
    </div>
  );
}
export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});
