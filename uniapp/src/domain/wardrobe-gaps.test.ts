import { describe, expect, it } from "vitest";
import { createDemoGarments } from "./demo";
import { analyzeWardrobeGaps } from "./wardrobe-gaps";

describe("wardrobe gap analysis", () => {
  it("prioritizes the minimum complete outfit categories", () => {
    expect(analyzeWardrobeGaps([]).slice(0, 3).map((item) => item.id)).toEqual(["base-top", "base-bottom", "base-shoes"]);
  });

  it("returns at most five actionable, unique category suggestions", () => {
    const result = analyzeWardrobeGaps(createDemoGarments(), { city: "当前位置", temp: 10, condition: "晴朗", code: 0, wind: 3, humidity: 50, observedAt: 1, source: "live" });
    expect(result.length).toBeLessThanOrEqual(5);
    expect(new Set(result.map((item) => item.categoryId)).size).toBe(result.length);
  });
});
