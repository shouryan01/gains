import { migrations } from "./migrations.generated";
export interface MigrationDatabase {
  exec(sql: string): unknown;
  selectValue(sql: string): unknown;
}
/** Append-only SQL migrations, applied atomically once per database. */
export function runMigrations(db: MigrationDatabase): void {
  db.exec("CREATE TABLE IF NOT EXISTS __gains_migrations (name TEXT PRIMARY KEY NOT NULL)");
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const migration of migrations) {
      const name = migration.name.replaceAll("'", "''");
      if (db.selectValue(`SELECT 1 FROM __gains_migrations WHERE name = '${name}'`)) continue;
      db.exec(migration.sql);
      db.exec(`INSERT INTO __gains_migrations(name) VALUES ('${name}')`);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
