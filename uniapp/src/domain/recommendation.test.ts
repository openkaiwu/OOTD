import { describe, expect, it } from "vitest";
import { createDemoGarments } from "./demo";
import { defaultPreference } from "@/infrastructure/repositories";
import {
  apparentTemperature,
  generateOutfits,
  layerFor,
  outfitSignature,
  seasonForContext,
  wardrobeReadiness,
} from "./recommendation";
import type { Garment, RecommendationContext, WeatherSnapshot } from "./types";

const context = (): RecommendationContext => ({
  source: "scene", sceneId: "date", preferredStyleIds: ["elegant"], preferredColorIds: [], avoidedColorIds: [],
  excludedOutfitSignatures: [], generatedAt: 1722900000000,
});

const weather = (temp: number, extra: Partial<WeatherSnapshot> = {}): WeatherSnapshot => ({
  city: "上海", temp, condition: "晴", code: 1, wind: 8, humidity: 55, observedAt: 1722900000000, source: "manual",
  ...extra,
});

const categoryOf = (garments: Garment[], id: string) => garments.find((item) => item.id === id)?.categoryId;

describe("recommendation engine", () => {
  it("recognizes a complete wardrobe", () => {
    expect(wardrobeReadiness(createDemoGarments())).toBe("complete");
    expect(wardrobeReadiness([])).toBe("empty");
  });

  it("computes apparent temperature and layering", () => {
    expect(apparentTemperature({ ...weather(30), humidity: 85 })).toBe(32);
    expect(apparentTemperature({ ...weather(5), humidity: 85, wind: 25 })).toBe(3);
    expect(apparentTemperature({ ...weather(24), feelsLike: 27 })).toBe(27);
    expect(layerFor(30)).toBe("hot");
    expect(layerFor(26)).toBe("hot");
    expect(layerFor(25)).toBe("warm");
    expect(layerFor(19)).toBe("mild");
    expect(layerFor(11)).toBe("cold");
    expect(seasonForContext(context())).toBe("summer");
  });

  it("returns three distinct, valid outfits with score details", () => {
    const garments = createDemoGarments();
    const results = generateOutfits(garments, context(), defaultPreference, 3);
    expect(results).toHaveLength(3);
    expect(new Set(results.map((item) => outfitSignature(item.itemIds))).size).toBe(3);
    results.forEach((item) => {
      const categories = item.itemIds.map((id) => categoryOf(garments, id));
      expect(categories).toContain("shoes");
      expect(categories.includes("dress") || (
        categories.some((category) => category === "top-short" || category === "top-long")
        && categories.some((category) => category === "pants" || category === "skirt")
      )).toBe(true);
      expect(item.reason.length).toBeGreaterThan(8);
      expect(item.scoreDetail).toBeDefined();
      expect(item.score).toBe(item.scoreDetail!.weather + item.scoreDetail!.scene + item.scoreDetail!.color
        + item.scoreDetail!.preference + item.scoreDetail!.rotation);
    });
  });

  it("keeps outfits diverse in style or color family", () => {
    const garments = createDemoGarments();
    const results = generateOutfits(garments, context(), defaultPreference, 3);
    const profiles = results.map((outfit) => {
      const items = outfit.itemIds.map((id) => garments.find((item) => item.id === id)).filter(Boolean) as Garment[];
      const styles = [...new Set(items.flatMap((item) => item.styleIds))];
      const colors = [...new Set(items.map((item) => item.colorName))];
      return styles[0] + "|" + colors[0];
    });
    expect(new Set(profiles).size).toBeGreaterThanOrEqual(2);
  });

  it("requires outerwear in cold weather and forbids it in hot weather", () => {
    const garments = createDemoGarments();
    const winter = generateOutfits(garments, {
      ...context(),
      generatedAt: 1700000000000,
      weatherSnapshot: weather(4),
      seasonId: "winter",
    }, defaultPreference, 3);
    winter.forEach((outfit) => {
      expect(outfit.itemIds.some((id) => categoryOf(garments, id) === "outerwear")).toBe(true);
      outfit.itemIds.forEach((id) => {
        const item = garments.find((entry) => entry.id === id) as Garment;
        expect(item.seasonIds.length === 0 || item.seasonIds.includes("winter")).toBe(true);
      });
    });

    const summer = generateOutfits(garments, { ...context(), weatherSnapshot: weather(33, { humidity: 70 }) }, defaultPreference, 3);
    summer.forEach((outfit) => {
      expect(outfit.itemIds.some((id) => categoryOf(garments, id) === "outerwear")).toBe(false);
    });
  });

  it("honors pinned item and exclusions", () => {
    const garments = createDemoGarments();
    const first = generateOutfits(garments, { ...context(), pinnedItemId: "demo_bag" }, defaultPreference, 3);
    expect(first.length).toBeGreaterThan(0);
    first.forEach((item) => expect(item.itemIds).toContain("demo_bag"));
    const excluded = first.map((item) => outfitSignature(item.itemIds));
    const next = generateOutfits(garments, { ...context(), excludedOutfitSignatures: excluded }, defaultPreference, 3);
    expect(next).toHaveLength(3);
    next.forEach((item) => expect(excluded).not.toContain(outfitSignature(item.itemIds)));
  });

  it("lets feedback weights steer preference scoring", () => {
    const garments = createDemoGarments();
    const loved = {
      ...defaultPreference,
      positiveWeights: { demo_dress: 5 },
      styleWeights: { sweet: 6 },
    } as typeof defaultPreference;
    const hated = {
      ...defaultPreference,
      negativeWeights: { demo_dress: 8 },
    };
    const withLove = generateOutfits(garments, context(), loved, 3);
    const withHate = generateOutfits(garments, context(), hated, 3);
    expect(withLove.some((outfit) => outfit.itemIds.includes("demo_dress"))).toBe(true);
    expect(withHate.some((outfit) => outfit.itemIds.includes("demo_dress"))).toBe(false);
  });
});
