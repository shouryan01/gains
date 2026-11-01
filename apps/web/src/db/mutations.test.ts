import { expect, it } from "vitest";
import { mutationTables } from "./mutations";
it("tracks quoted DML, conflict clauses, and multiple mutations", () => {
  expect(mutationTables('INSERT INTO "workouts" (id) VALUES (?)')).toEqual(["workouts"]);
  expect(mutationTables("INSERT OR IGNORE INTO routines VALUES (?)")).toEqual(["routines"]);
  expect(mutationTables("UPDATE `user_settings` SET theme=?")).toEqual(["user_settings"]);
  expect(mutationTables("DELETE FROM [workout_sets]; DELETE FROM workouts")).toEqual([
    "workout_sets",
    "workouts",
  ]);
  expect(mutationTables("-- DELETE FROM workouts\nSELECT * FROM routines")).toEqual([]);
  expect(mutationTables("SELECT * FROM routines")).toEqual([]);
});
