import { describe, expect, it } from "vitest";
import { colorHarmonyOf, hexToRgb, hueDistance, isNeutralColorName } from "./color";

describe("color harmony", () => {
  it("converts hex and measures hue distance", () => {
    expect(hexToRgb("#FF8000")).toEqual([255, 128, 0]);
    expect(hexToRgb("1A1A1A")).toEqual([26, 26, 26]);
    expect(hexToRgb("nope")).toEqual([138, 138, 138]);
    expect(hueDistance(0, 30)).toBe(30);
    expect(hueDistance(350, 10)).toBe(20);
  });

  it("treats all-neutral or single-color outfits as harmonious", () => {
    expect(colorHarmonyOf([
      { colorName: "白色", colorHex: "#F5F5F5" },
      { colorName: "黑色", colorHex: "#1A1A1A" },
    ]).score).toBeGreaterThanOrEqual(19);
    expect(colorHarmonyOf([
      { colorName: "粉色", colorHex: "#E89AB8" },
      { colorName: "米色", colorHex: "#D8C9A8" },
    ]).label).toBe("中性色衬托");
    expect(isNeutralColorName("米色")).toBe(true);
    expect(isNeutralColorName("粉色")).toBe(false);
  });

  it("scores analogous color pairs above clashing pairs", () => {
    const analogous = colorHarmonyOf([
      { colorName: "粉色", colorHex: "#E89AB8" },
      { colorName: "红色", colorHex: "#D64545" },
    ]);
    const clashing = colorHarmonyOf([
      { colorName: "蓝色", colorHex: "#3D7AD6" },
      { colorName: "紫色", colorHex: "#7A4AD6" },
    ]);
    expect(analogous.label).toBe("邻近色");
    expect(analogous.score).toBeGreaterThan(clashing.score);
    expect(clashing.score).toBeLessThanOrEqual(12);
  });

  it("tolerates complementary pairs and mutes low-saturation clashes", () => {
    expect(colorHarmonyOf([
      { colorName: "橙色", colorHex: "#E88A3D" },
      { colorName: "蓝色", colorHex: "#3D7AD6" },
    ]).label).toBe("对比撞色");
    const muted = colorHarmonyOf([
      { colorName: "红色", colorHex: "#D64545" },
      { colorName: "绿色", colorHex: "#5FA86A" },
      { colorName: "白色", colorHex: "#F5F5F5" },
    ]);
    expect(muted.label).toBe("低饱和过渡");
    expect(muted.score).toBeGreaterThanOrEqual(17);
  });

  it("penalizes outfits with many unrelated hues", () => {
    const rainbow = colorHarmonyOf([
      { colorName: "红色", colorHex: "#D64545" },
      { colorName: "黄色", colorHex: "#E8C44A" },
      { colorName: "绿色", colorHex: "#5FA86A" },
      { colorName: "蓝色", colorHex: "#3D7AD6" },
    ]);
    expect(rainbow.label).toBe("花色较多");
    expect(rainbow.score).toBeLessThanOrEqual(13);
    expect(colorHarmonyOf([]).score).toBe(20);
  });
});
