import type { Statement } from "@gains/db";
export type StorageStatus = { mode: "opfs" | "memory"; reason?: string; filename: string };
export type Method =
  | "exec"
  | "run"
  | "all"
  | "get"
  | "values"
  | "batch"
  | "seedDemo"
  | "resetDb"
  | "status";
export interface Request {
  id: number;
  method: Method;
  sql?: string;
  params?: (string | number | null)[];
  statements?: Statement[];
  objectRows?: boolean;
  today?: string;
}
export interface Response {
  id: number;
  result?: unknown;
  error?: string;
  changedTables?: string[];
}
