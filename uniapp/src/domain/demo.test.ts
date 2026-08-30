import { describe, expect, it } from "vitest";
import { createDemoGarments } from "./demo";
import type { CategoryId } from "./types";

describe("demo wardrobe fixtures", () => {
  it("provides one hundred stable women's fashion records", () => {
    const garments = createDemoGarments(1_722_900_000_000);
    const counts = garments.reduce<Record<CategoryId, number>>((result, item) => {
      result[item.categoryId] += 1;
      return result;
    }, {
      "top-short": 0, "top-long": 0, outerwear: 0, pants: 0,
      skirt: 0, dress: 0, shoes: 0, accessory: 0,
    });

    expect(garments).toHaveLength(100);
    expect(new Set(garments.map((item) => item.id)).size).toBe(100);
    expect(counts).toEqual({
      "top-short": 16, "top-long": 12, outerwear: 12, pants: 12,
      skirt: 12, dress: 16, shoes: 16, accessory: 4,
    });
    expect(garments.filter((item) => item.favorite).length).toBeGreaterThanOrEqual(10);
    expect(garments.filter((item) => item.wearCount > 0).length).toBeGreaterThanOrEqual(30);
    garments.forEach((item) => {
      expect(item.schemaVersion).toBe(2);
      expect(item.availability).toBe("active");
      expect(item.imagePath.startsWith("/static/")).toBe(true);
      expect(item.tags).toContain("模拟数据");
      expect(item.tags).toContain("女士流行款");
    });
    expect(garments.filter((item) => item.categoryId === "accessory").every((item) => item.name.includes("包"))).toBe(true);
  });

  it("covers heels, flats, blouses, dresses, skirts and all four seasons", () => {
    const garments = createDemoGarments();
    const names = garments.map((item) => item.name);
    expect(names.filter((name) => name.includes("高跟")).length).toBeGreaterThanOrEqual(5);
    expect(names.filter((name) => name.includes("平底")).length).toBeGreaterThanOrEqual(5);
    expect(names.filter((name) => name.includes("衬衫")).length).toBeGreaterThanOrEqual(10);
    expect(garments.filter((item) => item.categoryId === "dress").length).toBeGreaterThanOrEqual(16);
    expect(names.filter((name) => name.includes("短裙")).length).toBeGreaterThanOrEqual(4);
    for (const season of ["spring", "summer", "autumn", "winter"] as const) {
      expect(garments.filter((item) => item.seasonIds.includes(season)).length).toBeGreaterThanOrEqual(10);
    }
  });
});
