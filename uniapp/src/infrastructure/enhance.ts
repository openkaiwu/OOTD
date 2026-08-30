import { grayWorldWhiteBalance, percentileStretch, unsharpMask } from "@/domain/imageops";
import { matteCanvas, cropCanvasToAlpha } from "./matte";

// H5/WebView 图片增强管线：多步 ½ 降采样 + 灰世界白平衡 + 直方图拉伸 + USM 锐化，
// 随后自动抠图把衣物从背景中分离为透明底 PNG。
// 仅在有 DOM Canvas 的环境（Android WebView 预览）生效，其余平台返回 null 由调用方回退。

export interface EnhancedImage {
  path: string;
  thumbnail: string;
  base64: string;
  colorPixels: Uint8ClampedArray;
  width: number;
  height: number;
  /** 是否成功抠图（path/thumbnail 为透明底 PNG） */
  matted: boolean;
  /** 未抠图的增强版全图（JPEG），确认页可与抠图结果切换 */
  originalPath: string;
  /** 未抠图的增强版缩略图（JPEG） */
  originalThumbnail: string;
}

// 抠图全图最大边长：透明 PNG 体积比 JPEG 大，限制尺寸避免撑爆本地存储
const MATTE_FULL_EDGE = 1200;

export interface EnhanceOptions {
  maxEdge?: number;
  thumbnailEdge?: number;
  aiEdge?: number;
}

type CanvasPair = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };

function createCanvas(width: number, height: number): CanvasPair | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  return ctx ? { canvas, ctx } : null;
}

function drawScaled(source: HTMLCanvasElement | HTMLImageElement, sourceWidth: number, sourceHeight: number, width: number, height: number): CanvasPair | null {
  const pair = createCanvas(width, height);
  if (!pair) return null;
  pair.ctx.imageSmoothingEnabled = true;
  pair.ctx.imageSmoothingQuality = "high";
  pair.ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
  return pair;
}

function downscale(source: HTMLCanvasElement | HTMLImageElement, width: number, height: number, targetEdge: number): CanvasPair | null {
  let current = source;
  let currentWidth = width;
  let currentHeight = height;
  while (Math.max(currentWidth, currentHeight) > targetEdge * 2) {
    const halfWidth = Math.max(1, Math.round(currentWidth / 2));
    const halfHeight = Math.max(1, Math.round(currentHeight / 2));
    const next = drawScaled(current, currentWidth, currentHeight, halfWidth, halfHeight);
    if (!next) return null;
    current = next.canvas;
    currentWidth = halfWidth;
    currentHeight = halfHeight;
  }
  const scale = Math.min(1, targetEdge / Math.max(currentWidth, currentHeight));
  if (scale >= 1) return drawScaled(current, currentWidth, currentHeight, currentWidth, currentHeight);
  return drawScaled(current, currentWidth, currentHeight, Math.max(1, Math.round(currentWidth * scale)), Math.max(1, Math.round(currentHeight * scale)));
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

// 把透明底的抠图结果平铺到白底，用于 AI 识图的小图（只让模型看到干净衣物）
function flattenToWhite(source: HTMLCanvasElement, targetEdge: number): CanvasPair | null {
  const scale = Math.min(1, targetEdge / Math.max(source.width, source.height));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const pair = createCanvas(width, height);
  if (!pair) return null;
  pair.ctx.fillStyle = "#ffffff";
  pair.ctx.fillRect(0, 0, width, height);
  pair.ctx.imageSmoothingEnabled = true;
  pair.ctx.imageSmoothingQuality = "high";
  pair.ctx.drawImage(source, 0, 0, width, height);
  return pair;
}

export async function enhanceImage(src: string, options: EnhanceOptions = {}): Promise<EnhancedImage | null> {
  if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
  const maxEdge = options.maxEdge ?? 1600;
  const thumbnailEdge = options.thumbnailEdge ?? 320;
  const aiEdge = options.aiEdge ?? 768;
  const image = await loadImage(src);
  if (!image) return null;

  try {
    const base = downscale(image, image.naturalWidth, image.naturalHeight, maxEdge);
    if (!base) return null;
    const imageData = base.ctx.getImageData(0, 0, base.canvas.width, base.canvas.height);
    grayWorldWhiteBalance(imageData.data);
    percentileStretch(imageData.data);
    unsharpMask(imageData.data, imageData.width, imageData.height);
    base.ctx.putImageData(imageData, 0, 0);

    // 未抠图的增强版（JPEG）先保留，确认页可与抠图结果切换
    const originalPath = base.canvas.toDataURL("image/jpeg", 0.8);
    if (!originalPath.startsWith("data:image")) return null;
    const originalThumbPair = downscale(base.canvas, base.canvas.width, base.canvas.height, thumbnailEdge);
    if (!originalThumbPair) return null;
    const originalThumbnail = originalThumbPair.canvas.toDataURL("image/jpeg", 0.72);
    if (!originalThumbnail.startsWith("data:image")) return null;

    // 自动抠图：成功时输出透明底 PNG（限制尺寸控制存储体积），否则沿用原图
    const matted = matteCanvas(base.canvas);
    if (matted) {
      // 抠图成功后把四周透明留白裁掉，让后续 PNG / 缩略图 / AI 识图图都只含衣物本体
      const cropped = cropCanvasToAlpha(base.canvas);
      if (cropped) base.canvas = cropped;
    }
    let path = originalPath;
    if (matted) {
      const matteEdge = Math.min(maxEdge, MATTE_FULL_EDGE);
      const mattePair = downscale(base.canvas, base.canvas.width, base.canvas.height, matteEdge);
      if (!mattePair) return null;
      path = mattePair.canvas.toDataURL("image/png");
      if (!path.startsWith("data:image")) return null;
    }

    // 缩略图 + 主色采样（抠图后缩略图为透明 PNG，背景像素带 alpha=0）
    const thumb = downscale(base.canvas, base.canvas.width, base.canvas.height, thumbnailEdge);
    if (!thumb) return null;
    const thumbPixels = thumb.ctx.getImageData(0, 0, thumb.canvas.width, thumb.canvas.height);
    const thumbnail = matted ? thumb.canvas.toDataURL("image/png") : thumb.canvas.toDataURL("image/jpeg", 0.72);
    if (!thumbnail.startsWith("data:image")) return null;

    // AI 识图小图：抠图后平铺到白底，让模型只看到干净的衣物
    const aiSource = matted
      ? flattenToWhite(base.canvas, aiEdge)
      : downscale(base.canvas, base.canvas.width, base.canvas.height, aiEdge);
    const aiDataUrl = aiSource ? aiSource.canvas.toDataURL("image/jpeg", 0.75) : "";
    const base64 = aiDataUrl.includes(",") ? aiDataUrl.slice(aiDataUrl.indexOf(",") + 1) : "";

    return {
      path,
      thumbnail,
      base64,
      colorPixels: thumbPixels.data,
      width: base.canvas.width,
      height: base.canvas.height,
      matted,
      originalPath,
      originalThumbnail,
    };
  } catch {
    return null;
  }
}
