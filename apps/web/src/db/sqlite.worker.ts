/// <reference lib="webworker" />
import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import {
  demoStatements,
  resetStatements,
  runMigrations,
  tableNames,
  type Statement,
} from "@gains/db";
import { mutationTables } from "./mutations";
import type { Request, Response, StorageStatus } from "./protocol";

const initialization = (async () => {
  const sqlite3 = await sqlite3InitModule();
  let db: InstanceType<typeof sqlite3.oo1.DB>;
  let status: StorageStatus;
  try {
    const pool = await sqlite3.installOpfsSAHPoolVfs({ name: "gains-opfs", initialCapacity: 6 });
    db = new pool.OpfsSAHPoolDb("/gains-local.sqlite3");
    status = { mode: "opfs", filename: "/gains-local.sqlite3" };
  } catch (error) {
    db = new sqlite3.oo1.DB(":memory:");
    status = {
      mode: "memory",
      filename: ":memory:",
      reason: `Persistent storage is unavailable (it may be restricted or open in another tab). Data lasts until this tab closes. ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  runMigrations(db);
  return { db, status };
})();
// Attach a rejection handler immediately; each RPC also receives the actual error.
void initialization.catch(() => {});
let queue = Promise.resolve();
self.onmessage = (event: MessageEvent<Request>) => {
  const request = event.data;
  queue = queue.then(async () => {
    const response: Response = { id: request.id };
    try {
      const { db, status } = await initialization;
      const execute = (statement: Statement, objectRows = false) =>
        objectRows
          ? db.exec({
              sql: statement.sql,
              bind: statement.params ?? [],
              rowMode: "object",
              returnValue: "resultRows",
            })
          : db.exec({
              sql: statement.sql,
              bind: statement.params ?? [],
              rowMode: "array",
              returnValue: "resultRows",
            });
      if (request.method === "status") response.result = status;
      else if (["batch", "seedDemo", "resetDb"].includes(request.method)) {
        const statements =
          request.method === "seedDemo"
            ? demoStatements(new Date(request.today!))
            : request.method === "resetDb"
              ? resetStatements()
              : (request.statements ?? []);
        db.exec("BEGIN IMMEDIATE");
        try {
          response.result = statements.map((statement) => execute(statement));
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        response.changedTables =
          request.method === "batch"
            ? [...new Set(statements.flatMap((statement) => mutationTables(statement.sql)))]
            : tableNames;
      } else {
        const rows = execute({ sql: request.sql!, params: request.params }, request.objectRows);
        response.result = request.method === "get" ? rows[0] : rows;
        response.changedTables = mutationTables(request.sql!);
      }
    } catch (error) {
      response.error = error instanceof Error ? error.message : String(error);
    }
    self.postMessage(response);
  });
};
