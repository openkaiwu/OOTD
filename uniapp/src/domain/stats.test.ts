import { describe, expect, it } from "vitest";
import { createDemoGarments } from "./demo";
import { calculateStats } from "./stats";
import type { Outfit } from "./types";

describe("product stats", () => {
  it("uses real wear and feedback records", () => {
    const now = 1722900000000;
    const garments = createDemoGarments(now - 50 * 86400000).slice(0, 4)
      .map((item, index) => ({ ...item, lastWornAt: index < 2 ? now - 86400000 : undefined }));
    const outfit = (id: string, feedback: Outfit["feedback"]): Outfit => ({
      id, name: id, itemIds: ["demo_dress", "demo_shoes"], sceneId: "date",
      contextSnapshot: { source: "scene", sceneId: "date", preferredStyleIds: [], preferredColorIds: [], avoidedColorIds: [], excludedOutfitSignatures: [], generatedAt: now },
      score: 90, reason: "test", styleTags: [], feedback, dislikeReasons: [], saved: true, wornAtList: [now - 86400000], createdAt: now, updatedAt: now, schemaVersion: 2,
    });
    const stats = calculateStats(garments, [outfit("one", "liked"), outfit("two", "liked"), outfit("three", "disliked")], now);
    expect(stats.utilization).toBe(50);
    expect(stats.satisfaction).toBe(67);
    expect(stats.weeklyWorn).toBe(3);
    expect(stats.generatedOutfits).toBe(3);
    expect(stats.savedOutfits).toBe(3);
    expect(stats.wornOutfits).toBe(3);
    expect(stats.wearEvents).toBe(3);
    expect(stats.feedbackCount).toBe(3);
  });
});
