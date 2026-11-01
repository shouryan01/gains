import { useEffect, useState } from "react";
import { localDate } from "@gains/shared";
import { query } from "./client";
import { useLiveSQLiteQuery } from "./use-live-query";
import type { WeightMeasurement, WorkoutSummary } from "../lib/chart-data";
export type NutritionDay = {
  date: string;
  target_calories: number;
  target_protein_g: number;
  total_calories: number;
  total_protein_g: number;
  is_partial: number;
};
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
export function useDashboard() {
  const now = useNow();
  const today = localDate(now);
  const state = useLiveSQLiteQuery(
    async () => {
      const [workouts, weights, nutrition] = await Promise.all([
        query<WorkoutSummary>(
          "SELECT id, name, started_at, duration_seconds, total_sets, total_volume_lb, status FROM workouts WHERE deleted_at IS NULL ORDER BY started_at DESC",
        ),
        query<WeightMeasurement>(
          "SELECT date, scale_weight_lb, trend_weight_lb FROM body_measurements WHERE deleted_at IS NULL ORDER BY date",
        ),
        query<NutritionDay>(
          "SELECT date, target_calories, target_protein_g, total_calories, total_protein_g, is_partial FROM nutrition_days WHERE deleted_at IS NULL AND date=?",
          [today],
        ),
      ]);
      return { workouts, weights, nutrition: nutrition[0] };
    },
    ["workouts", "body_measurements", "nutrition_days"],
    [today],
  );
  return { ...state, now };
}
