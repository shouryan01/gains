import { createRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Library } from "lucide-react";
import { rootRoute } from "./__root";
import { query } from "../db/client";
import { useLiveSQLiteQuery } from "../db/use-live-query";
import { displayWeight, usePreferences } from "../db/preferences";
import { PageHeader } from "../components/layout/page-header";
export type RoutineSummary = {
  id: string;
  name: string;
  estimated_duration_min: number | null;
  notes: string | null;
  exercise_count: number;
};
export type HistoryWorkout = {
  id: string;
  name: string;
  started_at: number;
  duration_seconds: number | null;
  total_sets: number;
  total_volume_lb: number;
};
export function RoutineRows({ routines }: { routines: RoutineSummary[] }) {
  return (
    <div className="routine-list">
      {routines.map((routine) => (
        <details key={routine.id} className="routine-entry">
          <summary>
            <div>
              <strong>{routine.name}</strong>
              <p>
                {routine.exercise_count} exercises
                {routine.estimated_duration_min != null &&
                  ` · ${routine.estimated_duration_min} min`}
              </p>
            </div>
            <ChevronRight size={19} />
          </summary>
          <RoutinePreview id={routine.id} />
        </details>
      ))}
    </div>
  );
}
function RoutinePreview({ id }: { id: string }) {
  const { unit } = usePreferences();
  const { data, error } = useLiveSQLiteQuery(
    () =>
      query<{ name: string; template_sets: string; notes: string | null }>(
        "SELECT e.name, re.template_sets, re.notes FROM routine_exercises re JOIN exercises e ON re.exercise_id=e.id WHERE re.routine_id=? AND re.deleted_at IS NULL AND e.deleted_at IS NULL ORDER BY re.sort_order",
        [id],
      ),
    ["routine_exercises", "exercises"],
    [id],
  );
  return (
    <div className="routine-preview">
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      {data?.map((row, i) => {
        let sets: { targetWeightLb?: number; targetReps?: number }[] = [];
        try {
          sets = JSON.parse(row.template_sets);
        } catch {
          /* A corrupt template should not hide the rest of the routine. */
        }
        return (
          <div className="routine-exercise" key={`${i}-${row.name}`}>
            <span className="exercise-position">{i + 1}</span>
            <div>
              <strong>{row.name}</strong>
              <p>
                {Array.isArray(sets) ? `${sets.length} sets` : "Sets unavailable"}
                {Array.isArray(sets) &&
                  sets[0]?.targetReps != null &&
                  ` · ${sets[0].targetReps} reps`}
                {Array.isArray(sets) &&
                  sets[0]?.targetWeightLb != null &&
                  ` · ${displayWeight(sets[0].targetWeightLb, unit)} ${unit}`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export function useRoutines() {
  return useLiveSQLiteQuery(
    () =>
      query<RoutineSummary>(
        "SELECT r.id, r.name, r.estimated_duration_min, r.notes, (SELECT COUNT(*) FROM routine_exercises re WHERE re.routine_id=r.id AND re.deleted_at IS NULL) AS exercise_count FROM routines r WHERE r.deleted_at IS NULL ORDER BY r.sort_order, r.name",
      ),
    ["routines", "routine_exercises"],
  );
}
function Train() {
  const routines = useRoutines();
  const { unit } = usePreferences();
  const history = useLiveSQLiteQuery(
    () =>
      query<HistoryWorkout>(
        "SELECT id, name, started_at, duration_seconds, total_sets, total_volume_lb FROM workouts WHERE deleted_at IS NULL AND status='completed' ORDER BY started_at DESC",
      ),
    ["workouts"],
  );
  return (
    <div>
      <PageHeader title="Train" />
      <div className="train-links">
        <Link to="/routines">
          Routines <ChevronRight size={17} />
        </Link>
        <Link to="/exercises">
          <Library size={17} />
          Exercise library <ChevronRight size={17} />
        </Link>
      </div>
      {(routines.error || history.error) && (
        <p className="error" role="alert">
          {routines.error?.message ?? history.error?.message}
        </p>
      )}
      <div className="train-grid">
        <section className="overview-module">
          <div className="section-heading">
            <h2>Routines</h2>
            <span className="muted small">{routines.data?.length ?? 0} saved</span>
          </div>
          {routines.loading ? (
            <p className="muted">Loading routines…</p>
          ) : routines.data?.length ? (
            <RoutineRows routines={routines.data} />
          ) : (
            <div className="module-empty">
              <p>No routines saved.</p>
              <Link to="/settings" className="text-link">
                Load demo data <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </section>
        <section className="history-section">
          <h2>Workout history</h2>
          {history.data?.map((workout) => (
            <details className="workout-history" key={workout.id}>
              <summary>
                <div>
                  <strong>{workout.name}</strong>
                  <p>
                    {new Date(workout.started_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                    {workout.duration_seconds != null &&
                      ` · ${Math.round(workout.duration_seconds / 60)} min`}{" "}
                    · {workout.total_sets} sets
                  </p>
                </div>
                <ChevronRight size={18} />
              </summary>
              <div className="history-detail">
                <span>
                  {Math.round(
                    Number(displayWeight(workout.total_volume_lb, unit)),
                  ).toLocaleString()}{" "}
                  {unit} total volume
                </span>
                <span>Completed</span>
              </div>
            </details>
          ))}
          {!history.loading && !history.data?.length && (
            <div className="module-empty">
              <p>No completed workouts yet.</p>
            </div>
          )}
        </section>
      </div>
      <p className="release-note">
        Routine editing arrives in v0.3; active workout logging in v0.4.
      </p>
    </div>
  );
}
export const trainRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/train",
  component: Train,
});
