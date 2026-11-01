import { expect, it } from "vitest";
import { defaultOverviewOrder, normalizeOverviewOrder, readAppearance } from "./preference-values";
it("repairs overview order without losing the user's valid choices", () => {
  expect(normalizeOverviewOrder(["weight", "weight", "unknown", 3, "nutrition"])).toEqual([
    "weight",
    "nutrition",
    "training",
  ]);
  expect(normalizeOverviewOrder(null)).toEqual(defaultOverviewOrder);
  expect(normalizeOverviewOrder("training")).toEqual(defaultOverviewOrder);
});
it("accepts only supported cached appearance values", () => {
  expect(readAppearance('{"theme":"dark","colorPreset":"open"}')).toEqual({
    theme: "dark",
    colorPreset: "open",
  });
  expect(readAppearance('{"theme":"invalid","colorPreset":"other"}')).toEqual({
    theme: "system",
    colorPreset: "factor",
  });
  expect(readAppearance("bad json")).toEqual(readAppearance(null));
});
