import { describe, expect, it } from "vitest";
import { applyFeedback, decayFeedback } from "./feedback";
import type { Garment, UserPreference } from "./types";

const preference = (): UserPreference => ({
  styleIds: [], sceneIds: [], preferredColorIds: [], avoidedColorIds: [],
  rotateUnderused: true, allowIncomplete: false, negativeWeights: {}, schemaVersion: 1,
});

const garment = (id: string, styleIds: string[], colorName: string): Garment => ({
  id, name: id, imagePath: "", thumbnailPath: "", categoryId: "dress", colorHex: "#D64545", colorName,
  seasonIds: ["spring"], styleIds, sceneIds: [], tags: [], favorite: false, availability: "active",
  wearCount: 0, createdAt: 0, updatedAt: 0, schemaVersion: 2,
});

const outfit = [garment("a", ["sweet", "elegant"], "粉色"), garment("b", ["casual"], "白色")];
const now = 1700000000000;

describe("feedback loop", () => {
  it("rewards styles, colors and items on like", () => {
    const next = applyFeedback(preference(), outfit, { liked: true }, now);
    expect(next.styleWeights?.sweet).toBe(1);
    expect(next.styleWeights?.casual).toBe(1);
    expect(next.colorWeights?.粉色).toBe(0.5);
    expect(next.positiveWeights?.a).toBe(1);
    expect(next.lastFeedbackAt).toBe(now);
  });

  it("routes dislike reasons to the right weights", () => {
    const style = applyFeedback(preference(), outfit, { liked: false, reason: "style" }, now);
    expect(style.styleWeights?.sweet).toBe(-1.5);
    expect(style.colorWeights?.粉色).toBeUndefined();
    const color = applyFeedback(preference(), outfit, { liked: false, reason: "color" }, now);
    expect(color.colorWeights?.粉色).toBe(-2);
    expect(color.colorWeights?.白色).toBe(-2);
    const item = applyFeedback(preference(), outfit, { liked: false, reason: "item" }, now);
    expect(item.negativeWeights.a).toBe(1);
    expect(item.negativeWeights.b).toBe(1);
    const weather = applyFeedback(preference(), outfit, { liked: false, reason: "weather" }, now);
    expect(weather.negativeWeights).toEqual({});
    expect(weather.lastFeedbackAt).toBe(now);
  });

  it("clamps weights to a bounded range", () => {
    let current = preference();
    for (let round = 0; round < 20; round += 1) {
      current = applyFeedback(current, [outfit[0]], { liked: false, reason: "color" }, now);
    }
    expect(current.colorWeights?.粉色).toBe(-6);
  });

  it("decays weights with a half life and clears leftovers", () => {
    const learned = applyFeedback(preference(), [outfit[0]], { liked: true }, now);
    const monthLater = decayFeedback(learned, now + 30 * 86400000);
    expect(monthLater.styleWeights?.sweet).toBeCloseTo(0.5, 1);
    expect(monthLater.positiveWeights?.a).toBeCloseTo(0.5, 1);
    expect(monthLater.lastFeedbackAt).toBe(now + 30 * 86400000);
    const longAfter = decayFeedback(learned, now + 400 * 86400000);
    expect(longAfter.styleWeights?.sweet).toBeUndefined();
    expect(longAfter.lastFeedbackAt).toBeUndefined();
  });

  it("keeps preference untouched when there is nothing to decay", () => {
    const plain = preference();
    expect(decayFeedback(plain, now + 90 * 86400000)).toBe(plain);
  });
});
