import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "@gains/db/schema";
import type { Statement } from "@gains/db";
import type { Method, Request, Response, StorageStatus } from "./protocol";

const worker = new Worker(new URL("./sqlite.worker.ts", import.meta.url), { type: "module" });
const changes = new EventTarget();
let sequence = 0;
let fatalError: Error | undefined;
const pending = new Map<
  number,
  {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();
worker.onmessage = ({ data }: MessageEvent<Response>) => {
  const task = pending.get(data.id);
  if (!task) return;
  clearTimeout(task.timer);
  pending.delete(data.id);
  if (data.error) task.reject(new Error(data.error));
  else {
    task.resolve(data.result);
    if (data.changedTables?.length)
      changes.dispatchEvent(new CustomEvent("change", { detail: data.changedTables }));
  }
};
worker.onerror = (event) => {
  fatalError = new Error(event.message || "SQLite worker could not start");
  for (const task of pending.values()) {
    clearTimeout(task.timer);
    task.reject(fatalError);
  }
  pending.clear();
};
export function rpc<T>(method: Method, options: Omit<Request, "id" | "method"> = {}): Promise<T> {
  if (fatalError) return Promise.reject(fatalError);
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("SQLite request timed out. Close other Gains tabs and reload."));
    }, 30000);
    pending.set(id, { resolve: (value) => resolve(value as T), reject, timer });
    worker.postMessage({ id, method, ...options });
  });
}
export const db = drizzle(
  async (sql, params, method) => ({ rows: await rpc<unknown[]>(method, { sql, params }) }),
  { schema },
);
export const storageStatus = () => rpc<StorageStatus>("status");
export const query = <T extends Record<string, unknown>>(
  sql: string,
  params: Statement["params"] = [],
) => rpc<T[]>("all", { sql, params, objectRows: true });
export const batch = (statements: Statement[]) => rpc("batch", { statements });
export const seedDemo = () => rpc("seedDemo", { today: new Date().toISOString() });
export const resetDb = () => rpc("resetDb");
export function subscribeTables(tables: string[], callback: () => void) {
  const listener = (event: Event) => {
    if ((event as CustomEvent<string[]>).detail.some((table) => tables.includes(table))) callback();
  };
  changes.addEventListener("change", listener);
  return () => changes.removeEventListener("change", listener);
}

// A replaced Vite module must release OPFS handles before a new worker opens them.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    fatalError = new Error("The database is reloading. Refresh the page if needed.");
    worker.terminate();
    for (const task of pending.values()) {
      clearTimeout(task.timer);
      task.reject(fatalError);
    }
    pending.clear();
  });
}
