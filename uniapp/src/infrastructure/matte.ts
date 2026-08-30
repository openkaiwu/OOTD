// 本地自动抠图：从边缘采样背景色，做连通区域填充，把衣物从背景中分离为透明底。
// computeBackgroundMask / applyMatte 是纯函数，可脱离 DOM 单测；
// matteCanvas / matteImageToPng 依赖 Canvas，仅在 H5/WebView 环境使用。

const BORDER_RATIO = 0.012;
const MIN_BORDER = 2;
const BASE_TOLERANCE = 34;
const MAX_TOLERANCE = 74;
const COVERAGE_MIN = 0.5;
const DOMINANT_MIN_FRACTION = 0.18;
const MIN_REMOVED_FRACTION = 0.04;
const MAX_REMOVED_FRACTION = 0.98;

export interface BackgroundMask {
  mask: Uint8Array;
  tolerance: number;
  background: [number, number, number];
}

function distance2(ar: number, ag: number, ab: number, br: number, bg: number, bb: number): number {
  const dr = ar - br, dg = ag - bg, db = ab - bb;
  return dr * dr + dg * dg + db * db;
}

function isBorderPixel(x: number, y: number, width: number, height: number, border: number): boolean {
  return y < border || y >= height - border || x < border || x >= width - border;
}

// 计算背景蒙版。边缘背景杂乱（或整幅几乎同色）时返回 null，表示放弃抠图。
export function computeBackgroundMask(width: number, height: number, rgba: Uint8ClampedArray): BackgroundMask | null {
  const pixelCount = width * height;
  if (width < 8 || height < 8 || rgba.length < pixelCount * 4) return null;

  const border = Math.max(MIN_BORDER, Math.round(Math.min(width, height) * BORDER_RATIO));

  // 1) 边缘像素量化直方图，取主背景色
  const histogram = new Map<number, number>();
  const bucketOf = (index: number): number => {
    const r = rgba[index], g = rgba[index + 1], b = rgba[index + 2];
    return ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
  };
  let total = 0;
  for (let i = 0; i < pixelCount; i++) {
    const x = i % width, y = (i / width) | 0;
    if (!isBorderPixel(x, y, width, height, border)) continue;
    const bucket = bucketOf(i * 4);
    histogram.set(bucket, (histogram.get(bucket) || 0) + 1);
    total += 1;
  }
  if (!total) return null;

  let dominantBucket = 0, dominantCount = 0;
  histogram.forEach((count, bucket) => {
    if (count > dominantCount) { dominantCount = count; dominantBucket = bucket; }
  });
  if (dominantCount / total < DOMINANT_MIN_FRACTION) return null;

  // 2) 背景色 = 主桶均值；算覆盖率与边缘距离分布，自适应容差
  let bgR = 0, bgG = 0, bgB = 0, inBucket = 0;
  for (let i = 0; i < pixelCount; i++) {
    const x = i % width, y = (i / width) | 0;
    if (!isBorderPixel(x, y, width, height, border) || bucketOf(i * 4) !== dominantBucket) continue;
    const index = i * 4;
    bgR += rgba[index]; bgG += rgba[index + 1]; bgB += rgba[index + 2];
    inBucket += 1;
  }
  if (!inBucket) return null;
  const background: [number, number, number] = [Math.round(bgR / inBucket), Math.round(bgG / inBucket), Math.round(bgB / inBucket)];

  const base2 = BASE_TOLERANCE * BASE_TOLERANCE;
  const distances: number[] = [];
  let coverage = 0;
  for (let i = 0; i < pixelCount; i++) {
    const x = i % width, y = (i / width) | 0;
    if (!isBorderPixel(x, y, width, height, border)) continue;
    const index = i * 4;
    const d2 = distance2(rgba[index], rgba[index + 1], rgba[index + 2], background[0], background[1], background[2]);
    distances.push(d2);
    if (d2 <= base2) coverage += 1;
  }
  coverage /= total;
  if (coverage < COVERAGE_MIN) return null;
  distances.sort((a, b) => a - b);
  const p90 = distances[Math.min(distances.length - 1, Math.floor(distances.length * 0.9))];
  const tolerance = Math.min(MAX_TOLERANCE, Math.max(BASE_TOLERANCE, Math.round(Math.sqrt(p90) * 0.8 + 8)));

  // 3) 从边缘做连通填充：只有色距在容差内且与边缘相连的像素才算背景，
  //    衣物主体即使与背景同色（中间有分界线）也不会被误删。
  const mask = new Uint8Array(pixelCount);
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0, tail = 0;
  const t2 = tolerance * tolerance;
  const tryFill = (i: number): void => {
    if (visited[i]) return;
    visited[i] = 1;
    const index = i * 4;
    if (distance2(rgba[index], rgba[index + 1], rgba[index + 2], background[0], background[1], background[2]) <= t2) {
      mask[i] = 1;
      queue[tail++] = i;
    }
  };
  for (let i = 0; i < pixelCount; i++) {
    const x = i % width, y = (i / width) | 0;
    if (isBorderPixel(x, y, width, height, border)) tryFill(i);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % width, y = (i / width) | 0;
    if (x > 0) tryFill(i - 1);
    if (x < width - 1) tryFill(i + 1);
    if (y > 0) tryFill(i - width);
    if (y < height - 1) tryFill(i + width);
  }

  // 4) 背景占比太小（衣物几乎占满）或太大（几乎全是背景，无分离边）都视为无背景可抠
  let removed = 0;
  for (let i = 0; i < pixelCount; i++) removed += mask[i];
  const removedFraction = removed / pixelCount;
  if (removedFraction < MIN_REMOVED_FRACTION || removedFraction > MAX_REMOVED_FRACTION) return null;

  return { mask, tolerance, background };
}

// 把背景像素透明化，并对紧邻背景的衣物边界做轻度羽化，消除硬边白边。
export function applyMatte(rgba: Uint8ClampedArray, mask: Uint8Array, width: number): void {
  const pixelCount = mask.length;
  const height = Math.max(1, (pixelCount / width) | 0);
  for (let i = 0; i < pixelCount; i++) {
    if (mask[i]) rgba[i * 4 + 3] = 0;
  }
  for (let i = 0; i < pixelCount; i++) {
    if (mask[i]) continue;
    const x = i % width, y = (i / width) | 0;
    const touching =
      (x > 0 && mask[i - 1]) ||
      (x < width - 1 && mask[i + 1]) ||
      (y > 0 && mask[i - width]) ||
      (y < height - 1 && mask[i + width]);
    if (touching && rgba[i * 4 + 3] > 200) rgba[i * 4 + 3] = 200;
  }
}

const ALPHA_BOUNDS_THRESHOLD = 24;
const ALPHA_BOUNDS_MAX_FRACTION = 0.98;

// 计算非透明像素的包围盒。空白（无可见像素）返回 null；可见像素占满 >98% 画面也返回 null（无需裁）。
export function computeAlphaBounds(width: number, height: number, rgba: Uint8ClampedArray): { x: number; y: number; w: number; h: number } | null {
  const pixelCount = width * height;
  if (width < 1 || height < 1 || rgba.length < pixelCount * 4) return null;
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let i = 0; i < pixelCount; i++) {
    if (rgba[i * 4 + 3] <= ALPHA_BOUNDS_THRESHOLD) continue;
    const x = i % width, y = (i / width) | 0;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  if (w / width > ALPHA_BOUNDS_MAX_FRACTION || h / height > ALPHA_BOUNDS_MAX_FRACTION) return null;
  return { x: minX, y: minY, w, h };
}

// 把 canvas 裁到非透明像素包围盒，返回新 canvas；空裁剪或无 document 环境返回 null。不修改入参。
export function cropCanvasToAlpha(canvas: HTMLCanvasElement): HTMLCanvasElement | null {
  if (typeof document === "undefined" || typeof canvas.getContext !== "function") return null;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const bounds = computeAlphaBounds(canvas.width, canvas.height, data.data);
  if (!bounds) return null;
  const out = document.createElement("canvas");
  out.width = bounds.w;
  out.height = bounds.h;
  const outCtx = out.getContext("2d", { willReadFrequently: true });
  if (!outCtx) return null;
  outCtx.putImageData(data, -bounds.x, -bounds.y);
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") return resolve(null);
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth ? image : null);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

// 对整张 canvas 执行抠图，成功返回 true（像素已写入透明通道）。
export function matteCanvas(canvas: HTMLCanvasElement): boolean {
  if (typeof document === "undefined" || typeof canvas.getContext !== "function") return false;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  const width = canvas.width, height = canvas.height;
  if (width < 8 || height < 8) return false;
  const data = ctx.getImageData(0, 0, width, height);
  const result = computeBackgroundMask(width, height, data.data);
  if (!result) return false;
  applyMatte(data.data, result.mask, width);
  ctx.putImageData(data, 0, 0);
  return true;
}

// 把任意图片（路径 / data URL）抠成透明底 PNG data URL，失败返回 null。
export async function matteImageToPng(src: string, maxEdge = 900): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const image = await loadImage(src);
  if (!image) return null;
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, width, height);
  if (!matteCanvas(canvas)) return null;
  const png = canvas.toDataURL("image/png");
  return png.startsWith("data:image") ? png : null;
}
