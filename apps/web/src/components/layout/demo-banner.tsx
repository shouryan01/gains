import { useEffect, useState } from "react";
import { RotateCcw, Sparkles, LoaderCircle } from "lucide-react";
import { tableNames } from "@gains/db";
import { query, resetDb, seedDemo, storageStatus } from "../../db/client";
import { useLiveSQLiteQuery } from "../../db/use-live-query";
import type { StorageStatus } from "../../db/protocol";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
export function useStorageStatus() {
  const [state, setState] = useState<{ status?: StorageStatus; error?: string }>({});
  useEffect(() => {
    let active = true;
    void storageStatus().then(
      (status) => {
        if (active) setState({ status });
      },
      (error: Error) => {
        if (active) setState({ error: error.message });
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return state;
}
export function DemoActions() {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"seed" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { data } = useLiveSQLiteQuery(
    () =>
      query<{ count: number }>(
        `SELECT SUM(n) AS count FROM (${tableNames.map((table) => `SELECT COUNT(*) AS n FROM "${table}"`).join(" UNION ALL ")})`,
      ),
    tableNames,
  );
  const perform = async (action: "seed" | "reset") => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await (action === "seed" ? seedDemo() : resetDb());
      setConfirm(null);
      setNotice(action === "seed" ? "Sample data is ready." : "Demo database reset.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="demo-actions">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            if ((data?.[0]?.count ?? 0) > 0) setConfirm("seed");
            else void perform("seed");
          }}
        >
          {busy ? <LoaderCircle size={14} className="spin" /> : <Sparkles size={14} />} Seed Demo
          Data
        </Button>
        <Button variant="ghost" disabled={busy} onClick={() => setConfirm("reset")}>
          <RotateCcw size={14} />
          <span>Reset Demo DB</span>
        </Button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <span className="sr-only" role="status">
        {notice}
      </span>
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
        title={confirm === "seed" ? "Replace demo data?" : "Reset your local database?"}
        description={
          confirm === "seed"
            ? "This replaces your local demo records with a fresh two-week sample. Your appearance, palette, overview order, and units stay saved."
            : "This removes all records and preferences from this browser’s demo database. This cannot be undone."
        }
      >
        <div className="dialog-actions">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant={confirm === "reset" ? "danger" : "default"}
            disabled={busy}
            onClick={() => {
              if (confirm) void perform(confirm);
            }}
          >
            {busy ? "Working…" : confirm === "seed" ? "Replace demo data" : "Reset database"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
