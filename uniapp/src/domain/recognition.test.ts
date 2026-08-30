import { describe, expect, it } from "vitest";
import { dominantColorFromPixels, guessCategory, guessSeasons, nearestNamedColor, rgbToHsl } from "./recognition";

describe("local recognition helpers", () => {
  it("maps dimensions to a low-confidence category suggestion", () => {
    expect(guessCategory(1600, 800)).toBe("shoes");
    expect(guessCategory(600, 1400)).toBe("dress");
    expect(guessCategory(800, 1000)).toBe("pants");
    expect(guessCategory(1000, 1000)).toBe("top-short");
  });

  it("maps a dominant lavender sample to purple", () => {
    const pixels = new Uint8ClampedArray(Array.from({ length: 40 }, () => [122, 74, 214, 255]).flat());
    expect(dominantColorFromPixels(pixels).name).toBe("紫色");
  });

  it("handles neutral and seasonal rules", () => {
    const [h, s, l] = rgbToHsl(245, 245, 245);
    expect(nearestNamedColor(h, s, l).name).toBe("白色");
    expect(guessSeasons("outerwear")).toEqual(["autumn", "winter"]);
  });
});
