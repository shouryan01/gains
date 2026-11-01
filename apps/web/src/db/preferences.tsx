import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { eq } from "drizzle-orm";
import { userSettings } from "@gains/db";
import { createClock, uuidv7 } from "@gains/shared";
import { db } from "./client";
import { useLiveSQLiteQuery } from "./use-live-query";
import {
  appearanceCacheKey,
  defaultOverviewOrder,
  normalizeOverviewOrder,
  readAppearance,
  type Theme,
  type ColorPreset,
  type Unit,
  type OverviewSection,
} from "./preference-values";
export type { Theme, ColorPreset, Unit, OverviewSection } from "./preference-values";
type PreferenceChange = {
  theme?: Theme;
  weightUnit?: Unit;
  colorPreset?: ColorPreset;
  overviewOrder?: OverviewSection[];
};
const clock = createClock("web");
const PreferencesContext = createContext({
  theme: "system" as Theme,
  colorPreset: "factor" as ColorPreset,
  unit: "lb" as Unit,
  overviewOrder: defaultOverviewOrder,
  saving: false,
  error: "",
  setPreference: async (_values: PreferenceChange): Promise<boolean> => false,
});
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const {
    data,
    loading,
    error: loadError,
  } = useLiveSQLiteQuery(
    () => db.select().from(userSettings).where(eq(userSettings.userId, "demo")).get(),
    ["user_settings"],
  );
  const [cached] = useState(() => {
    try {
      return readAppearance(localStorage.getItem(appearanceCacheKey));
    } catch {
      return readAppearance(null);
    }
  });
  const theme = loading || loadError ? cached.theme : (data?.theme ?? "system");
  const colorPreset = loading || loadError ? cached.colorPreset : (data?.colorPreset ?? "factor");
  const unit = data?.weightUnit ?? "lb";
  const overviewOrder = normalizeOverviewOrder(data?.overviewOrder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useLayoutEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.palette = colorPreset;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", resolved === "dark" ? "#080809" : "#F5F5F5");
    };
    apply();
    if (!loading && !loadError) {
      try {
        localStorage.setItem(appearanceCacheKey, JSON.stringify({ theme, colorPreset }));
      } catch {
        /* OPFS preferences still work if localStorage is unavailable. */
      }
    }
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, colorPreset, loading, loadError]);
  const setPreference = async (values: PreferenceChange) => {
    setSaving(true);
    setError("");
    try {
      const now = Date.now();
      const hlc = clock.send();
      const changes = {
        ...values,
        ...(values.overviewOrder
          ? { overviewOrder: normalizeOverviewOrder(values.overviewOrder) }
          : {}),
      };
      await db
        .insert(userSettings)
        .values({ id: uuidv7(), userId: "demo", createdAt: now, updatedAt: now, hlc, ...changes })
        .onConflictDoUpdate({
          target: userSettings.userId,
          set: { ...changes, updatedAt: now, hlc },
        });
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return false;
    } finally {
      setSaving(false);
    }
  };
  return (
    <PreferencesContext.Provider
      value={{
        theme,
        colorPreset,
        unit,
        overviewOrder,
        saving,
        error: error || loadError?.message || "",
        setPreference,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
export const usePreferences = () => useContext(PreferencesContext);
export function displayWeight(lb: number, unit: Unit) {
  return (unit === "kg" ? lb * 0.45359237 : lb).toFixed(1);
}
