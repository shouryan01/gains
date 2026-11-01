import { createRoute } from "@tanstack/react-router";
import { Check, Database, HardDrive, Laptop, Moon, ShieldCheck, Sun } from "lucide-react";
import { tableNames } from "@gains/db";
import { rootRoute } from "./__root";
import { query } from "../db/client";
import { useLiveSQLiteQuery } from "../db/use-live-query";
import { usePreferences } from "../db/preferences";
import { DemoActions, useStorageStatus } from "../components/layout/demo-banner";
import { Card } from "../components/ui/card";
import { PageHeader } from "../components/layout/page-header";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
function Settings() {
  const { theme, colorPreset, unit, saving, error, setPreference } = usePreferences();
  const { status, error: storageError } = useStorageStatus();
  const { data, error: inspectorError } = useLiveSQLiteQuery(async () => {
    const [counts, pages, size, version] = await Promise.all([
      query<{ name: string; count: number }>(
        tableNames
          .map((name) => `SELECT '${name}' AS name, COUNT(*) AS count FROM "${name}"`)
          .join(" UNION ALL "),
      ),
      query<{ page_count: number }>("PRAGMA page_count"),
      query<{ page_size: number }>("PRAGMA page_size"),
      query<{ version: string }>("SELECT sqlite_version() AS version"),
    ]);
    return {
      counts,
      bytes: pages[0]!.page_count * size[0]!.page_size,
      version: version[0]!.version,
    };
  }, tableNames);
  return (
    <div className="route-enter">
      <PageHeader title="Settings" settings={false} />
      {(error || storageError || inspectorError) && (
        <p className="error" role="alert">
          {error || storageError || inspectorError?.message}
        </p>
      )}
      <div className="settings-grid">
        <Card>
          <div className="card-heading">
            <h2>Preferences</h2>
            <Laptop size={18} />
          </div>
          <div className="preference-row">
            <div>
              <h3>Appearance</h3>
            </div>
            <Tabs
              value={theme}
              onValueChange={(value) => {
                void setPreference({ theme: value as typeof theme });
              }}
            >
              <TabsList className="segmented" aria-label="Appearance">
                {[
                  { value: "light", icon: Sun },
                  { value: "dark", icon: Moon },
                  { value: "system", icon: Laptop },
                ].map(({ value, icon: Icon }) => (
                  <TabsTrigger key={value} value={value} disabled={saving}>
                    <Icon size={14} />
                    {value}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="preference-row palette-preference">
            <h3>Color preset</h3>
            <fieldset className="palette-options">
              <legend className="sr-only">Color preset</legend>
              {(
                [
                  { value: "factor", label: "Factor", color: "Blue" },
                  { value: "open", label: "Open", color: "Green" },
                ] as const
              ).map((preset) => (
                <label
                  className={`palette-option ${colorPreset === preset.value ? "selected" : ""}`}
                  key={preset.value}
                >
                  <input
                    type="radio"
                    name="color-preset"
                    value={preset.value}
                    checked={colorPreset === preset.value}
                    disabled={saving}
                    onChange={() => {
                      void setPreference({ colorPreset: preset.value });
                    }}
                  />
                  <span className={`palette-swatch ${preset.value}`} aria-hidden="true" />
                  <span>
                    {preset.label}
                    <small>{preset.color}</small>
                  </span>
                  <Check size={17} className="palette-check" aria-hidden="true" />
                </label>
              ))}
            </fieldset>
          </div>
          <div className="preference-row">
            <div>
              <h3>Weight unit</h3>
            </div>
            <Tabs
              value={unit}
              onValueChange={(value) => {
                void setPreference({ weightUnit: value as typeof unit });
              }}
            >
              <TabsList className="segmented" aria-label="Weight unit">
                <TabsTrigger value="lb" disabled={saving}>
                  lb
                </TabsTrigger>
                <TabsTrigger value="kg" disabled={saving}>
                  kg
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </Card>
        <Card>
          <div className="card-heading">
            <h2>Demo workspace</h2>
            <ShieldCheck size={18} />
          </div>
          <p className="settings-description">Load sample data or reset the demo database.</p>
          <DemoActions />
        </Card>
        <details className="storage-disclosure">
          <summary>
            <span>
              <Database size={19} />
              Storage details
            </span>
            <span className="muted small">
              {data ? `${(data.bytes / 1024).toFixed(1)} KB` : "Loading…"}
            </span>
          </summary>
          <Card className="inspector-card">
            <div className="card-heading">
              <div>
                <h2>Local SQLite</h2>
              </div>
              <Database size={20} />
            </div>
            <div className="storage-info">
              <div>
                <span>Storage engine</span>
                <strong>
                  {status
                    ? status.mode === "opfs"
                      ? "OPFS Persistent SQLite Active"
                      : "Memory Fallback"
                    : "Opening…"}
                </strong>
              </div>
              <div>
                <span>Database file</span>
                <code>{status?.filename ?? "—"}</code>
              </div>
              <div>
                <span>Database size</span>
                <strong>{data ? `${(data.bytes / 1024).toFixed(1)} KB` : "—"}</strong>
              </div>
              <div>
                <span>SQLite version</span>
                <strong>{data?.version ?? "—"}</strong>
              </div>
            </div>
            {status?.reason && <p className="storage-warning">{status.reason}</p>}
            <div className="table-scroll">
              <table className="inspector-table">
                <thead>
                  <tr>
                    <th>Table</th>
                    <th>Rows</th>
                    <th>Storage</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.counts.map(({ name, count }) => (
                    <tr key={name}>
                      <td>
                        <Database size={13} />
                        <code>{name}</code>
                      </td>
                      <td>{count}</td>
                      <td>
                        <HardDrive size={12} /> Local
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>{tableNames.length} application tables</td>
                    <td>{data?.counts.reduce((sum, table) => sum + table.count, 0) ?? 0}</td>
                    <td>Demo mode</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </details>
      </div>
    </div>
  );
}
export const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: Settings,
});
