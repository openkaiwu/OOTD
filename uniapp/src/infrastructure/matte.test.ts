import { describe, expect, it } from "vitest";
import { applyMatte, computeAlphaBounds, computeBackgroundMask } from "./matte";

// 把矩形区域设为指定 alpha（其余保持 0，即透明）
function paintAlpha(data: Uint8ClampedArray, width: number, x0: number, y0: number, x1: number, y1: number, alpha: number): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) data[(y * width + x) * 4 + 3] = alpha;
  }
}

function solidImage(width: number, height: number, color: [number, number, number]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = color[0];
    data[i * 4 + 1] = color[1];
    data[i * 4 + 2] = color[2];
    data[i * 4 + 3] = 255;
  }
  return data;
}

function paintRect(data: Uint8ClampedArray, width: number, x0: number, y0: number, x1: number, y1: number, color: [number, number, number]): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * width + x) * 4;
      data[i] = color[0];
      data[i + 1] = color[1];
      data[i + 2] = color[2];
      data[i + 3] = 255;
    }
  }
}

describe("computeBackgroundMask", () => {
  it("removes a uniform light background and preserves the garment center", () => {
    const width = 60, height = 60;
    const data = solidImage(width, height, [255, 255, 255]);
    paintRect(data, width, 15, 15, 45, 45, [40, 60, 120]); // 深色衣物居中
    const result = computeBackgroundMask(width, height, data);
    expect(result).not.toBeNull();
    // 边缘是背景
    expect(result!.mask[0]).toBe(1);
    expect(result!.mask[(width * 2 + 2)]).toBe(1);
    // 中心衣物不是背景（连通填充被衣物边缘挡住）
    expect(result!.mask[30 * width + 30]).toBe(0);
  });

  it("gives up when the border is too varied to be a background", () => {
    const width = 40, height = 40;
    const data = new Uint8ClampedArray(width * height * 4);
    let seed = 7;
    const rand = (): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % 256;
    };
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = rand();
      data[i * 4 + 1] = rand();
      data[i * 4 + 2] = rand();
      data[i * 4 + 3] = 255;
    }
    expect(computeBackgroundMask(width, height, data)).toBeNull();
  });

  it("gives up when the frame is filled with the garment (no separable background)", () => {
    const width = 30, height = 30;
    const data = solidImage(width, height, [30, 30, 30]);
    expect(computeBackgroundMask(width, height, data)).toBeNull();
  });

  it("respects tolerance so a same-color interior enclosed by an edge survives", () => {
    const width = 70, height = 70;
    const data = solidImage(width, height, [240, 240, 240]);
    // 衣物 = 一个外圈深色边框，内部仍是浅色：内部浅色被边框隔开，不应被当作背景删除
    for (let y = 14; y <= 56; y++) {
      for (let x = 14; x <= 56; x++) {
        const onRing = x === 14 || x === 56 || y === 14 || y === 56;
        if (onRing) paintRect(data, width, x, y, x, y, [50, 50, 50]);
      }
    }
    const result = computeBackgroundMask(width, height, data);
    expect(result).not.toBeNull();
    expect(result!.mask[14 * width + 14]).toBe(0); // 衣身边框保留
    expect(result!.mask[35 * width + 35]).toBe(0); // 框内浅色区域与边缘不连通，保留
  });
});

describe("computeAlphaBounds", () => {
  it("returns null for an all-transparent image", () => {
    const data = new Uint8ClampedArray(30 * 20 * 4);
    expect(computeAlphaBounds(30, 20, data)).toBeNull();
  });

  it("finds the bounding box of a centered opaque object", () => {
    const width = 40, height = 30;
    const data = new Uint8ClampedArray(width * height * 4);
    paintAlpha(data, width, 10, 5, 25, 20, 255);
    expect(computeAlphaBounds(width, height, data)).toEqual({ x: 10, y: 5, w: 16, h: 16 });
  });

  it("returns null when the object fills the whole frame", () => {
    const width = 20, height = 20;
    const data = new Uint8ClampedArray(width * height * 4);
    paintAlpha(data, width, 0, 0, width - 1, height - 1, 255);
    data[0] = 0; // 仅留左上角一个透明像素
    expect(computeAlphaBounds(width, height, data)).toBeNull();
  });

  it("covers multiple separated regions with a single bounding box", () => {
    const width = 50, height = 50;
    const data = new Uint8ClampedArray(width * height * 4);
    paintAlpha(data, width, 5, 5, 8, 8, 255);
    paintAlpha(data, width, 40, 40, 45, 45, 255);
    expect(computeAlphaBounds(width, height, data)).toEqual({ x: 5, y: 5, w: 41, h: 41 });
  });

  it("ignores pixels at or below the alpha threshold", () => {
    const width = 20, height = 20;
    const data = new Uint8ClampedArray(width * height * 4);
    paintAlpha(data, width, 4, 4, 15, 15, 20); // 阈值之下，视为透明
    expect(computeAlphaBounds(width, height, data)).toBeNull();
  });

  it("guards against truncated pixel buffers", () => {
    const data = new Uint8ClampedArray(10 * 10 * 4 - 1);
    expect(computeAlphaBounds(10, 10, data)).toBeNull();
  });
});

describe("applyMatte", () => {
  it("zeroes background alpha and softens the garment boundary", () => {
    const width = 40, height = 40;
    const data = solidImage(width, height, [255, 255, 255]);
    paintRect(data, width, 12, 12, 28, 28, [60, 60, 60]);
    const result = computeBackgroundMask(width, height, data);
    expect(result).not.toBeNull();
    const before = data.slice();
    applyMatte(data, result!.mask, width);
    // 背景完全透明
    expect(data[3]).toBe(0);
    // 衣物中心保持不透明
    expect(data[(24 * width + 24) * 4 + 3]).toBe(255);
    // 边界被羽化（至少有一个非背景像素 alpha 被压低）
    let softened = false;
    for (let i = 0; i < width * height; i++) {
      if (!result!.mask[i] && data[i * 4 + 3] < before[i * 4 + 3]) softened = true;
    }
    expect(softened).toBe(true);
  });
});
