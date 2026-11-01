import { describe, expect, it } from "vitest";
import {
  lineSegments,
  nearestPoint,
  valueDomain,
  weeklySessions,
  weightPoints,
  type WorkoutSummary,
} from "./chart-data";
import { localDate } from "@gains/shared";
const workout = (date: string, status = "completed"): WorkoutSummary => ({
  id: date,
  name: "Push",
  started_at: new Date(`${date}T12:00:00`).getTime(),
  status,
  total_sets: 3,
  total_volume_lb: 100,
  duration_seconds: 600,
});
describe("chart data integrity", () => {
  it("groups sessions into local calendar weeks, including across the DST boundary", () => {
    const result = weeklySessions(
      [
        workout("2026-10-25"),
        workout("2026-10-26"),
        workout("2026-11-01"),
        workout("2026-11-01", "discarded"),
        workout("2026-11-02"),
      ],
      2,
      new Date("2026-11-01T23:00:00"),
    );
    expect(result.map((point) => localDate(new Date(point.x)))).toEqual([
      "2026-10-19",
      "2026-10-26",
    ]);
    expect(result.map((point) => point.values.sessions)).toEqual([1, 2]);
  });
  it("converts both weight series while preserving missing observations", () => {
    const result = weightPoints(
      [
        { date: "2026-11-02", scale_weight_lb: 200, trend_weight_lb: null },
        { date: "2026-11-01", scale_weight_lb: null, trend_weight_lb: 201 },
      ],
      "kg",
    );
    expect(result[0]!.values.scale).toBeNull();
    expect(result[0]!.values.trend).toBeCloseTo(91.172067);
    expect(result[1]!.values.scale).toBeCloseTo(90.718474);
    expect(result[1]!.values.trend).toBeNull();
  });
  it("does not connect trend lines through missing days or missing trend values", () => {
    const points = weightPoints(
      [
        { date: "2026-10-30", scale_weight_lb: 180, trend_weight_lb: 180 },
        { date: "2026-10-31", scale_weight_lb: 179, trend_weight_lb: 179.5 },
        { date: "2026-11-02", scale_weight_lb: 179, trend_weight_lb: 179 },
        { date: "2026-11-03", scale_weight_lb: 178, trend_weight_lb: null },
        { date: "2026-11-04", scale_weight_lb: 178, trend_weight_lb: 178 },
      ],
      "lb",
    );
    expect(lineSegments(points, "trend").map((segment) => segment.length)).toEqual([2, 1, 1]);
  });
  it("finds the nearest actual date and clamps inspection at either edge", () => {
    const points = [0, 10, 30].map((x) => ({ x, label: String(x), values: { count: x } }));
    expect(nearestPoint(points, -10)).toBe(0);
    expect(nearestPoint(points, 16)).toBe(1);
    expect(nearestPoint(points, 28)).toBe(2);
    expect(nearestPoint(points, 100)).toBe(2);
    expect(nearestPoint([], 5)).toBe(-1);
  });
  it("starts bars at zero and gives constant or empty weight data a valid domain", () => {
    const points = [{ x: 1, label: "one", values: { count: 3 } }];
    expect(
      valueDomain(points, [{ key: "count", label: "Count", kind: "bar", unit: "sessions" }]),
    ).toEqual([0, 4]);
    const [low, high] = valueDomain(points, [
      { key: "count", label: "Weight", kind: "line", unit: "lb" },
    ]);
    expect(low).toBeLessThan(3);
    expect(high).toBeGreaterThan(3);
    expect(valueDomain([], [])).toEqual([0, 1]);
  });
});
