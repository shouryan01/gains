import { useState } from "react";
import { createRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { localDate } from "@gains/shared";
import { rootRoute } from "./__root";
import { query } from "../db/client";
import { useLiveSQLiteQuery } from "../db/use-live-query";
import { useNow, type NutritionDay } from "../db/use-dashboard";
import { dateFromKey, moveDate } from "../lib/chart-data";
import { NutritionSummary } from "../components/dashboard/nutrition-summary";
import { PageHeader } from "../components/layout/page-header";
type FoodEntry = {
  id: string;
  name: string;
  meal_slot: string;
  calories: number;
  protein_g: number;
  servings: number;
  weight_grams: number | null;
  carbs_g: number | null;
  fat_g: number | null;
};
function Nutrition() {
  const now = useNow();
  const today = localDate(now);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const date = selectedDate ?? today;
  const { data, error, loading } = useLiveSQLiteQuery(
    async () => {
      const [days, entries] = await Promise.all([
        query<NutritionDay>(
          "SELECT date, target_calories, target_protein_g, total_calories, total_protein_g, is_partial FROM nutrition_days WHERE deleted_at IS NULL AND date=?",
          [date],
        ),
        query<FoodEntry>(
          "SELECT id, name, meal_slot, calories, protein_g, servings, weight_grams, carbs_g, fat_g FROM nutrition_entries WHERE deleted_at IS NULL AND date=? ORDER BY created_at, id",
          [date],
        ),
      ]);
      return { day: days[0], entries };
    },
    ["nutrition_days", "nutrition_entries"],
    [date],
  );
  const step = (direction: number) =>
    setSelectedDate(localDate(moveDate(dateFromKey(date), direction)));
  return (
    <div>
      <PageHeader title="Nutrition" />
      <div className="day-selector">
        <button
          type="button"
          className="icon-button"
          onClick={() => step(-1)}
          aria-label="Previous day"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <label className="date-picker-label">
            <span>
              {date === today
                ? "Today"
                : dateFromKey(date).toLocaleDateString(undefined, { weekday: "long" })}
            </span>
            <input
              type="date"
              aria-label="Nutrition date"
              max={today}
              value={date}
              onChange={(event) => {
                if (event.target.value && event.target.value <= today)
                  setSelectedDate(event.target.value);
              }}
            />
          </label>
        </div>
        <button
          type="button"
          className="icon-button"
          disabled={date >= today}
          onClick={() => step(1)}
          aria-label="Next day"
        >
          <ChevronRight size={22} />
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      <div className="nutrition-layout" aria-busy={loading}>
        <section className="overview-module nutrition-totals">
          <h2>Daily targets</h2>
          {loading ? (
            <p className="muted">Loading nutrition…</p>
          ) : (
            <NutritionSummary day={data?.day} />
          )}
        </section>
        <section className="food-log">
          <h2>Food log</h2>
          {!loading && !data?.entries.length && (
            <div className="module-empty">
              <p>No food logged for this day.</p>
            </div>
          )}
          {["breakfast", "lunch", "dinner", "snack"].map((slot) => {
            const entries = data?.entries.filter((entry) => entry.meal_slot === slot) ?? [];
            if (!entries.length) return null;
            return (
              <section className="meal-group" key={slot} aria-label={slot}>
                <div className="meal-heading">
                  <h3>{slot === "snack" ? "Snacks" : slot[0]!.toUpperCase() + slot.slice(1)}</h3>
                  <span>
                    {entries.reduce((sum, entry) => sum + entry.calories, 0).toLocaleString()} kcal
                  </span>
                </div>
                {entries.map((entry) => (
                  <details className="food-entry" key={entry.id}>
                    <summary>
                      <div>
                        <strong>{entry.name}</strong>
                        <p>
                          {entry.weight_grams != null
                            ? `${entry.weight_grams} g`
                            : `${entry.servings} serving${entry.servings === 1 ? "" : "s"}`}{" "}
                          · {entry.protein_g} g protein
                        </p>
                      </div>
                      <span>
                        {entry.calories.toLocaleString()}
                        <small>kcal</small>
                      </span>
                    </summary>
                    <div className="food-entry-detail">
                      <span>
                        Carbs: {entry.carbs_g == null ? "Not recorded" : `${entry.carbs_g} g`}
                      </span>
                      <span>Fat: {entry.fat_g == null ? "Not recorded" : `${entry.fat_g} g`}</span>
                    </div>
                  </details>
                ))}
              </section>
            );
          })}
        </section>
      </div>
      <p className="release-note">
        Food logging and target editing arrive in v0.7. You can browse the saved demo entries here.
      </p>
    </div>
  );
}
export const nutritionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/nutrition",
  component: Nutrition,
});
