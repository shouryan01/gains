import { tableNames } from "@gains/db";
/** Recognize ordinary DML; invalidate conservatively for CTEs or schema changes. */
export function mutationTables(sql: string): string[] {
  const clean = sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, " ");
  const matches = [
    ...clean.matchAll(
      /\b(?:insert\s+(?:or\s+\w+\s+)?into|replace\s+into|update\s+(?:or\s+\w+\s+)?|delete\s+from)\s*["`[]?(\w+)/gi,
    ),
  ];
  if (matches.length)
    return [
      ...new Set(
        matches
          .map((match) => match[1]!)
          .filter((name) => tableNames.some((table) => table === name)),
      ),
    ];
  return /\b(?:create|alter|drop|with|insert|update|delete|replace)\b/i.test(clean)
    ? tableNames
    : [];
}
