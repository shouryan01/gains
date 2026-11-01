export type Theme = "system" | "light" | "dark";
export type ColorPreset = "factor" | "open";
export type Unit = "lb" | "kg";
export type OverviewSection = "training" | "weight" | "nutrition";
export const defaultOverviewOrder: OverviewSection[] = ["training", "weight", "nutrition"];
export const appearanceCacheKey = "gains.appearance";
export function normalizeOverviewOrder(value: unknown): OverviewSection[] {
  const known = new Set<string>(defaultOverviewOrder);
  const selected = Array.isArray(value)
    ? value.filter((item): item is OverviewSection => typeof item === "string" && known.has(item))
    : [];
  return [...new Set([...selected, ...defaultOverviewOrder])];
}
export function readAppearance(value: string | null): { theme: Theme; colorPreset: ColorPreset } {
  try {
    const parsed: unknown = JSON.parse(value ?? "null");
    if (parsed && typeof parsed === "object") {
      const p = parsed as Record<string, unknown>;
      return {
        theme: p.theme === "light" || p.theme === "dark" ? p.theme : "system",
        colorPreset: p.colorPreset === "open" ? "open" : "factor",
      };
    }
  } catch {
    /* SQLite remains authoritative when the small paint cache is invalid. */
  }
  return { theme: "system", colorPreset: "factor" };
}
