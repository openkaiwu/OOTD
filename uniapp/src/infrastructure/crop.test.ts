import { describe, expect, it } from "vitest";
import { pixelRectFromNormalized } from "./crop";

describe("pixelRectFromNormalized", () => {
  it("maps a normalized box to pixel coordinates", () => {
    const rect = pixelRectFromNormalized({ left: 0.25, top: 0.5, width: 0.5, height: 0.25 }, 400, 200);
    expect(rect).toEqual({ x: 100, y: 100, w: 200, h: 50 });
  });

  it("rounds fractional pixel results", () => {
    const rect = pixelRectFromNormalized({ left: 0.333, top: 0.333, width: 0.333, height: 0.333 }, 300, 300);
    expect(rect.x).toBe(Math.round(0.333 * 300));
    expect(rect.y).toBe(Math.round(0.333 * 300));
    expect(rect.w).toBe(Math.max(4, Math.round(0.333 * 300)));
    expect(rect.h).toBe(Math.max(4, Math.round(0.333 * 300)));
  });

  it("clamps the box inside the image bounds", () => {
    // 框几乎滑出右下角
    const rect = pixelRectFromNormalized({ left: 1.2, top: 1.5, width: 0.5, height: 0.5 }, 200, 100);
    expect(rect.x).toBeLessThanOrEqual(200 - rect.w);
    expect(rect.y).toBeLessThanOrEqual(100 - rect.h);
    expect(rect.x).toBeGreaterThanOrEqual(0);
    expect(rect.y).toBeGreaterThanOrEqual(0);
  });

  it("clamps negative origins to zero", () => {
    const rect = pixelRectFromNormalized({ left: -0.3, top: -0.2, width: 0.6, height: 0.6 }, 200, 200);
    expect(rect.x).toBe(0);
    expect(rect.y).toBe(0);
    expect(rect.w).toBe(120);
    expect(rect.h).toBe(120);
  });

  it("enforces a minimum crop size", () => {
    const rect = pixelRectFromNormalized({ left: 0.5, top: 0.5, width: 0.001, height: 0.001 }, 10, 10);
    expect(rect.w).toBeGreaterThanOrEqual(4);
    expect(rect.h).toBeGreaterThanOrEqual(4);
  });
});
