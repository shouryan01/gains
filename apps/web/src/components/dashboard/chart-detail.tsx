import { useState } from "react";
import { usePreferences } from "../../db/preferences";
import {
  moveDate,
  startOfWeek,
  weeklySessions,
  weightPoints,
  type WorkoutSummary,
  type WeightMeasurement,
} from "../../lib/chart-data";
import { Dialog } from "../ui/dialog";
import { InteractiveChart } from "../charts/interactive-chart";
export type Metric = "training" | "weight";
export function ChartDetail({
  metric,
  onClose,
  workouts,
  weights,
  now,
}: {
  metric: Metric | null;
  onClose: () => void;
  workouts: WorkoutSummary[];
  weights: WeightMeasurement[];
  now: Date;
}) {
  const [ranges, setRanges] = useState<Record<Metric, string>>({ training: "4W", weight: "4W" });
  const range = metric ? ranges[metric] : "4W";
  const { unit } = usePreferences();
  const first = workouts.filter((w) => w.status === "completed").at(-1)?.started_at;
  const currentWeek = startOfWeek(now);
  const firstWeek = startOfWeek(new Date(first ?? now.getTime()));
  // Compare calendar dates in UTC so a DST transition cannot add a phantom week.
  const calendarWeeks =
    Math.round(
      (Date.UTC(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate()) -
        Date.UTC(firstWeek.getFullYear(), firstWeek.getMonth(), firstWeek.getDate())) /
        604800000,
    ) + 1;
  const weeks =
    range === "All" ? Math.max(1, calendarWeeks) : range === "1W" ? 1 : range === "12W" ? 12 : 4;
  const measurements = weights.filter(
    (w) => new Date(`${w.date}T00:00:00`).getTime() <= now.getTime(),
  );
  const points =
    metric === "training"
      ? weeklySessions(workouts, weeks, now)
      : weightPoints(measurements, unit).filter(
          (point) =>
            range === "All" ||
            point.x >=
              moveDate(now, -(range === "1W" ? 6 : range === "12W" ? 83 : 27)).setHours(0, 0, 0, 0),
        );
  return (
    <Dialog
      open={metric !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={metric === "training" ? "Completed sessions" : "Weight history"}
      description={
        metric === "training"
          ? "Completed sessions grouped by calendar week. Inspect a bar for its weekly total."
          : `Recorded scale and trend weight in ${unit}. Inspect a date for both values.`
      }
      className="chart-dialog"
    >
      <div className="range-control" aria-label="Chart range">
        {["1W", "4W", "12W", "All"].map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={range === value}
            onClick={() => {
              if (metric) setRanges((current) => ({ ...current, [metric]: value }));
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <InteractiveChart
        key={`${metric}-${range}`}
        label={`${metric === "training" ? "Weekly completed sessions" : "Scale and trend weight"}, ${range}`}
        points={points}
        series={
          metric === "training"
            ? [{ key: "sessions", label: "Completed", kind: "bar", unit: "sessions" }]
            : [
                { key: "trend", label: "Trend", kind: "line", unit },
                { key: "scale", label: "Scale", kind: "point", unit },
              ]
        }
        height={280}
        table
      />
    </Dialog>
  );
}
