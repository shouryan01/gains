import type { NutritionDay } from "../../db/use-dashboard";
export function NutritionSummary({ day, context }: { day?: NutritionDay; context?: string }) {
  if (!day)
    return (
      <div className="module-empty">
        <p>No nutrition logged for this day.</p>
      </div>
    );
  return (
    <div className="nutrition-summary">
      {[
        { label: "Calories", value: day.total_calories, goal: day.target_calories, unit: "kcal" },
        { label: "Protein", value: day.total_protein_g, goal: day.target_protein_g, unit: "g" },
      ].map((metric) => (
        <div className="nutrition-metric" key={metric.label}>
          <div className="nutrition-values">
            <span>{metric.label}</span>
            <strong>
              {metric.value.toLocaleString()}{" "}
              <small>
                / {metric.goal.toLocaleString()} {metric.unit}
              </small>
            </strong>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={metric.label}
            aria-valuemin={0}
            aria-valuemax={metric.goal || 1}
            aria-valuenow={Math.min(metric.value, metric.goal || 1)}
            aria-valuetext={`${metric.value} of ${metric.goal} ${metric.unit}`}
          >
            <span
              style={{
                width: `${Math.min(100, metric.goal > 0 ? (metric.value / metric.goal) * 100 : 0)}%`,
              }}
            />
          </div>
        </div>
      ))}
      <p className="muted small">
        {[context, day.is_partial ? "Partial day" : "Day logged"].filter(Boolean).join(" · ")}
      </p>
    </div>
  );
}
