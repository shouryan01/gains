import { Link } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import type { ReactNode } from "react";
export function PageHeader({
  title,
  subtitle,
  children,
  settings = true,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  settings?: boolean;
}) {
  return (
    <header className="page-header">
      <div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        <h1>{title}</h1>
      </div>
      <div className="header-actions">
        {children}
        <span className="demo-label">Demo</span>
        {settings && (
          <Link to="/settings" className="icon-button" aria-label="Settings">
            <Settings2 size={21} />
          </Link>
        )}
      </div>
    </header>
  );
}
