import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { demoStatements, resetStatements, tableNames } from "../demo-seed";
import { migrations } from "../migrations.generated";
import { runMigrations } from "../migrate";
let sqlite3: Awaited<ReturnType<typeof sqlite3InitModule>>;
type Database = InstanceType<Awaited<ReturnType<typeof sqlite3InitModule>>["oo1"]["DB"]>;
const opened: Database[] = [];
beforeAll(async () => {
  sqlite3 = await sqlite3InitModule();
});
function open() {
  const db = new sqlite3.oo1.DB(":memory:");
  opened.push(db);
  const adapter = db;
  runMigrations(adapter);
  return { db, adapter };
}
function apply(db: Database, statements = demoStatements(new Date("2026-10-31T12:00:00"))) {
  db.exec("BEGIN");
  try {
    for (const { sql, params } of statements) db.exec({ sql, bind: params ?? [] });
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
afterEach(() => {
  opened.splice(0).forEach((db) => db.close());
});
describe("shared SQLite contract", () => {
  it("keeps the bundled migration identical to the distributable SQL", () => {
    for (const migration of migrations)
      expect(migration.sql).toBe(
        readFileSync(new URL(`../../migrations/${migration.name}`, import.meta.url), "utf8"),
      );
  });
  it("creates all 19 tables and applies migrations idempotently without losing data", () => {
    const { db, adapter } = open();
    apply(db);
    runMigrations(adapter);
    expect(tableNames).toHaveLength(19);
    for (const name of tableNames)
      expect(() => db.selectObjects(`SELECT * FROM "${name}"`)).not.toThrow();
    expect(db.selectObject("SELECT COUNT(*) AS n FROM workouts")?.n).toBe(6);
    expect(db.selectObject("SELECT COUNT(*) AS n FROM __gains_migrations")?.n).toBe(
      migrations.length,
    );
  });
  it("seeds coherent workouts, nutrition totals, weight dates, and UUID records", () => {
    const { db } = open();
    apply(db);
    const expected = {
      exercises: 10,
      routines: 2,
      workouts: 6,
      workout_exercises: 30,
      workout_sets: 90,
      body_measurements: 14,
      nutrition_days: 14,
      nutrition_entries: 54,
    };
    for (const [name, n] of Object.entries(expected))
      expect(db.selectObject(`SELECT COUNT(*) AS n FROM ${name}`)?.n).toBe(n);
    expect(
      db.selectObject(
        "SELECT COUNT(*) AS n FROM workout_sets s LEFT JOIN workout_exercises e ON s.workout_exercise_id=e.id LEFT JOIN workouts w ON s.workout_id=w.id WHERE e.id IS NULL OR w.id IS NULL",
      )?.n,
    ).toBe(0);
    expect(
      db.selectObject(
        "SELECT COUNT(*) AS n FROM workouts w WHERE w.total_volume_lb != (SELECT SUM(s.weight_lb*s.reps) FROM workout_sets s WHERE s.workout_id=w.id)",
      )?.n,
    ).toBe(0);
    expect(
      db.selectObject(
        "SELECT COUNT(*) AS n FROM nutrition_days d WHERE d.total_calories != (SELECT SUM(e.calories) FROM nutrition_entries e WHERE e.date=d.date) OR d.total_protein_g != (SELECT SUM(e.protein_g) FROM nutrition_entries e WHERE e.date=d.date)",
      )?.n,
    ).toBe(0);
    expect(
      db.selectObject(
        "SELECT total_calories, total_protein_g, is_partial FROM nutrition_days WHERE date='2026-10-31'",
      ),
    ).toMatchObject({ total_calories: 1200, total_protein_g: 88, is_partial: 1 });
    expect(
      db.selectObject("SELECT COUNT(*) AS n FROM exercises_fts WHERE exercises_fts MATCH 'bench'")
        ?.n,
    ).toBe(1);
  });
  it("replaces seed data without duplicates, and reset clears all records and FTS", () => {
    const { db } = open();
    apply(db);
    apply(db);
    expect(db.selectObject("SELECT COUNT(*) AS n FROM workouts")?.n).toBe(6);
    apply(db, resetStatements());
    for (const name of tableNames)
      expect(db.selectObject(`SELECT COUNT(*) AS n FROM "${name}"`)?.n).toBe(0);
    expect(
      db.selectObject("SELECT COUNT(*) AS n FROM exercises_fts WHERE exercises_fts MATCH 'bench'")
        ?.n,
    ).toBe(0);
    apply(db);
    expect(
      db.selectObject("SELECT COUNT(*) AS n FROM exercises_fts WHERE exercises_fts MATCH 'bench'")
        ?.n,
    ).toBe(1);
  });
  it("upgrades an existing database without resetting workouts, theme, or units", () => {
    const db = new sqlite3.oo1.DB(":memory:");
    opened.push(db);
    db.exec(migrations[0]!.sql);
    db.exec("CREATE TABLE __gains_migrations (name TEXT PRIMARY KEY NOT NULL)");
    db.exec({
      sql: "INSERT INTO __gains_migrations(name) VALUES (?)",
      bind: [migrations[0]!.name],
    });
    db.exec(
      "INSERT INTO user_settings(id,user_id,created_at,updated_at,hlc,theme,weight_unit) VALUES ('existing','demo',1,1,'clock','dark','kg')",
    );
    db.exec(
      "INSERT INTO workouts(id,user_id,created_at,updated_at,hlc,name,status,started_at) VALUES ('session','demo',1,1,'clock','Existing workout','completed',1)",
    );
    runMigrations(db);
    expect(
      db.selectObject("SELECT theme, weight_unit, color_preset, overview_order FROM user_settings"),
    ).toMatchObject({
      theme: "dark",
      weight_unit: "kg",
      color_preset: "factor",
      overview_order: '["training","weight","nutrition"]',
    });
    expect(db.selectValue("SELECT COUNT(*) FROM workouts")).toBe(1);
    db.exec(
      'UPDATE user_settings SET color_preset=\'open\', overview_order=\'["weight","nutrition","training"]\'',
    );
    apply(db);
    runMigrations(db);
    expect(
      db.selectObject("SELECT theme, weight_unit, color_preset, overview_order FROM user_settings"),
    ).toMatchObject({
      theme: "dark",
      weight_unit: "kg",
      color_preset: "open",
      overview_order: '["weight","nutrition","training"]',
    });
  });
  it("rolls back an entire failed batch", () => {
    const { db } = open();
    apply(db);
    expect(() =>
      apply(db, [...resetStatements(), { sql: "INSERT INTO nonexistent VALUES (1)" }]),
    ).toThrow();
    expect(db.selectObject("SELECT COUNT(*) AS n FROM workouts")?.n).toBe(6);
  });
});
