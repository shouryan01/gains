import { Link } from "@tanstack/react-router";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { query } from "../db/client";
import { useLiveSQLiteQuery } from "../db/use-live-query";
import { Card } from "../components/ui/card";
export function Placeholder({
  title,
  version,
  icon: Icon,
  table,
  label,
}: {
  title: string;
  version: string;
  icon: LucideIcon;
  table: string;
  label: string;
}) {
  const { data, error } = useLiveSQLiteQuery(
    () =>
      query<{ count: number }>(`SELECT COUNT(*) AS count FROM "${table}" WHERE deleted_at IS NULL`),
    [table],
  );
  return (
    <div className="route-enter">
      <div className="page-heading">
        <h1>{title}</h1>
      </div>
      <Card className="placeholder-hero">
        <span className="placeholder-icon">
          <Icon size={42} strokeWidth={1.5} />
        </span>
        <h2>Coming in {version}</h2>
        <div className="placeholder-count">
          <strong>{data?.[0]?.count ?? 0}</strong>
          <span>{label} saved</span>
        </div>
        {error && (
          <p className="error" role="alert">
            {error.message}
          </p>
        )}
        <Link to="/" className="button button-secondary">
          <ArrowLeft size={15} />
          Back to Home
        </Link>
      </Card>
    </div>
  );
}
