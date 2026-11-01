import { useState } from "react";
import { createRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Search } from "lucide-react";
import { rootRoute } from "./__root";
import { query } from "../db/client";
import { useLiveSQLiteQuery } from "../db/use-live-query";
import { PageHeader } from "../components/layout/page-header";
type Exercise = {
  id: string;
  name: string;
  equipment: string;
  target: string;
  instructions: string;
};
function Exercises() {
  const [search, setSearch] = useState("");
  const { data, error, loading } = useLiveSQLiteQuery(
    () =>
      query<Exercise>(
        "SELECT id, name, equipment, target, instructions FROM exercises WHERE deleted_at IS NULL ORDER BY name",
      ),
    ["exercises"],
  );
  const filtered = data?.filter((row) =>
    `${row.name} ${row.target} ${row.equipment}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  );
  return (
    <div>
      <PageHeader title="Exercises" />
      <Link to="/train" className="back-link">
        <ArrowLeft size={16} />
        Train
      </Link>
      <label className="search-field">
        <Search size={20} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search saved exercises"
          aria-label="Search saved exercises"
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error.message}
        </p>
      )}
      <section className="exercise-library" aria-busy={loading}>
        {filtered?.map((row) => {
          let instructions: string[] = [];
          try {
            const decoded: unknown = JSON.parse(row.instructions);
            if (Array.isArray(decoded))
              instructions = decoded.filter((v): v is string => typeof v === "string");
          } catch {
            /* Keep the exercise readable if its instructions are malformed. */
          }
          return (
            <details key={row.id} className="exercise-library-row">
              <summary>
                <div>
                  <strong>{row.name}</strong>
                  <p>
                    {row.equipment} · {row.target}
                  </p>
                </div>
              </summary>
              <ol>
                {instructions.map((instruction, i) => (
                  <li key={i}>{instruction}</li>
                ))}
              </ol>
            </details>
          );
        })}
        {!loading && !filtered?.length && (
          <div className="module-empty">
            <p>
              {search
                ? "No matching saved exercises."
                : "No exercises loaded. Load demo data in Settings to explore."}
            </p>
          </div>
        )}
      </section>
      <p className="release-note">
        The full catalog, filters, and custom exercises arrive in v0.2.
      </p>
    </div>
  );
}
export const exercisesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exercises",
  component: Exercises,
});
