import { describe, expect, it } from "vitest";
import { grayWorldWhiteBalance, percentileStretch, unsharpMask } from "./imageops";

function solidImage(pixels: Array<[number, number, number]>, width: number, height: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const [r, g, b] = pixels[index % pixels.length];
    data[index * 4] = r;
    data[index * 4 + 1] = g;
    data[index * 4 + 2] = b;
    data[index * 4 + 3] = 255;
  }
  return data;
}

describe("image enhancement ops", () => {
  it("neutralizes color casts with gray world balance", () => {
    const data = solidImage([[200, 150, 110]], 8, 8);
    grayWorldWhiteBalance(data);
    const r = data[0], g = data[4], b = data[8];
    expect(Math.abs(r - g)).toBeLessThanOrEqual(20);
    expect(Math.abs(g - b)).toBeLessThanOrEqual(25);
  });

  it("skips already balanced images", () => {
    const data = solidImage([[128, 130, 127]], 8, 8);
    grayWorldWhiteBalance(data);
    expect(Array.from(data.slice(0, 12))).toEqual([128, 130, 127, 255, 128, 130, 127, 255, 128, 130, 127, 255]);
  });
  it("stretches low-contrast photos toward full range", () => {
    const data = solidImage([[60, 60, 60], [90, 90, 90], [120, 120, 120], [150, 150, 150]], 16, 16);
    percentileStretch(data);
    expect(data[0]).toBeLessThanOrEqual(10);
    expect(data[(16 * 16 - 1) * 4]).toBeGreaterThanOrEqual(240);
  });

  it("keeps flat images untouched by sharpening", () => {
    const data = solidImage([[100, 120, 140]], 6, 6);
    unsharpMask(data, 6, 6);
    expect(Array.from(data.slice(0, 12))).toEqual([100, 120, 140, 255, 100, 120, 140, 255, 100, 120, 140, 255]);
  });

  it("amplifies edges with unsharp mask", () => {
    const data = new Uint8ClampedArray(5 * 5 * 4);
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const value = x < 2 ? 40 : 200;
        const index = (y * 5 + x) * 4;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
        data[index + 3] = 255;
      }
    }
    const beforeEdge = data[(2 * 5 + 2) * 4];
    unsharpMask(data, 5, 5, 0.6);
    expect(data[(2 * 5 + 2) * 4]).toBeGreaterThan(beforeEdge);
    expect(data[(1 * 5 + 1) * 4]).toBeLessThan(40);
  });
});
