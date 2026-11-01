import { localDate } from "@gains/shared";
export type ChartPoint = { x: number; label: string; values: Record<string, number | null> };
export type ChartSeries = {
  key: string;
  label: string;
  kind: "line" | "point" | "bar";
  unit: string;
  secondary?: boolean;
};
export type WorkoutSummary = {
  id: string;
  name: string;
  started_at: number;
  duration_seconds: number | null;
  total_sets: number;
  total_volume_lb: number;
  status: string;
};
export type WeightMeasurement = {
  date: string;
  scale_weight_lb: number | null;
  trend_weight_lb: number | null;
};
export function dateFromKey(date: string): Date {
  return new Date(`${date}T00:00:00`);
}
export function moveDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
export function startOfWeek(date: Date): Date {
  const start = moveDate(date, -((date.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start;
}
export function weeklySessions(
  workouts: WorkoutSummary[],
  weeks: number,
  today: Date,
): ChartPoint[] {
  const start = moveDate(startOfWeek(today), -(weeks - 1) * 7);
  const counts = new Map<string, number>();
  for (const workout of workouts) {
    if (workout.status !== "completed" || workout.started_at > today.getTime()) continue;
    const key = localDate(startOfWeek(new Date(workout.started_at)));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from({ length: weeks }, (_, i) => {
    const date = moveDate(start, i * 7);
    return {
      x: date.getTime(),
      label: `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      values: { sessions: counts.get(localDate(date)) ?? 0 },
    };
  });
}
export function weightPoints(measurements: WeightMeasurement[], unit: "lb" | "kg"): ChartPoint[] {
  const convert = (value: number | null) =>
    value == null || !Number.isFinite(value) ? null : value * (unit === "kg" ? 0.45359237 : 1);
  return [...measurements]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      x: dateFromKey(row.date).getTime(),
      label: dateFromKey(row.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      values: { scale: convert(row.scale_weight_lb), trend: convert(row.trend_weight_lb) },
    }));
}
export function nearestPoint(points: ChartPoint[], x: number): number {
  if (!points.length) return -1;
  let low = 0,
    high = points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle]!.x < x) low = middle + 1;
    else high = middle;
  }
  return low > 0 && Math.abs(points[low - 1]!.x - x) <= Math.abs(points[low]!.x - x)
    ? low - 1
    : low;
}
export function valueDomain(points: ChartPoint[], series: ChartSeries[]): [number, number] {
  const values = points
    .flatMap((point) => series.map((s) => point.values[s.key]))
    .filter((v): v is number => v != null && Number.isFinite(v));
  if (!values.length) return [0, 1];
  const min = Math.min(...values),
    max = Math.max(...values);
  if (series.some((s) => s.kind === "bar"))
    return [Math.min(0, min), Math.max(2, Math.ceil(max * 1.2))];
  const padding = Math.max((max - min) * 0.18, 0.25);
  return [min - padding, max + padding];
}
/** Preserve missing values and gaps between nonconsecutive weigh-in dates. */
export function lineSegments(points: ChartPoint[], key: string): ChartPoint[][] {
  const segments: ChartPoint[][] = [];
  let current: ChartPoint[] = [];
  for (const point of points) {
    const previous = current.at(-1);
    if (point.values[key] == null || (previous && point.x - previous.x > 36 * 60 * 60 * 1000)) {
      if (current.length) segments.push(current);
      current = [];
    }
    if (point.values[key] != null) current.push(point);
  }
  if (current.length) segments.push(current);
  return segments;
}
