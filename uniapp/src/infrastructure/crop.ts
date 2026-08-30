// 手动裁剪：把裁剪框的归一化显示坐标换算成像素矩形并执行裁剪。
// pixelRectFromNormalized 是纯函数，可脱离 DOM 单测；cropImageDataUrl 依赖 Canvas，仅在 H5/WebView 使用。

export interface NormalizedCrop {
  /** 裁剪框左上角，相对图片宽度的比例 [0,1) */
  left: number;
  /** 裁剪框左上角，相对图片高度的比例 [0,1) */
  top: number;
  /** 裁剪框宽度比例 (0,1] */
  width: number;
  /** 裁剪框高度比例 (0,1] */
  height: number;
}

export interface PixelRect { x: number; y: number; w: number; h: number }

// 把归一化裁剪框映射到像素坐标，并夹紧到图片范围内、保证最小尺寸。
export function pixelRectFromNormalized(crop: NormalizedCrop, naturalWidth: number, naturalHeight: number): PixelRect {
  const width = Math.max(1, naturalWidth);
  const height = Math.max(1, naturalHeight);
  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
  const minW = Math.min(width, 4);
  const minH = Math.min(height, 4);
  const left = clamp(crop.left, 0, 1);
  const top = clamp(crop.top, 0, 1);
  const wRatio = clamp(crop.width, minW / width, 1);
  const hRatio = clamp(crop.height, minH / height, 1);
  let x = Math.round(left * width);
  let y = Math.round(top * height);
  let w = Math.max(minW, Math.round(wRatio * width));
  let h = Math.max(minH, Math.round(hRatio * height));
  // 夹到图片右/下边界内
  x = Math.min(x, width - w);
  y = Math.min(y, height - h);
  return { x, y, w, h };
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

export interface CropOptions {
  /** 输出图最长边上限，控制体积 */
  maxEdge?: number;
}

// 按像素矩形裁出图片并返回 data URL：源是透明底 PNG 则输出 PNG，否则输出 JPEG。
// 无 document 环境（非 H5/WebView）返回 null。
export async function cropImageDataUrl(src: string, crop: NormalizedCrop, options: CropOptions = {}): Promise<string | null> {
  if (typeof document === "undefined" || typeof document.createElement !== "function") return null;
  const image = await loadImage(src);
  if (!image) return null;
  const maxEdge = options.maxEdge ?? 1200;
  const rect = pixelRectFromNormalized(crop, image.naturalWidth, image.naturalHeight);
  const scale = Math.min(1, maxEdge / Math.max(rect.w, rect.h));
  const width = Math.max(1, Math.round(rect.w * scale));
  const height = Math.max(1, Math.round(rect.h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h, 0, 0, width, height);
  const isPng = src.startsWith("data:image/png");
  const dataUrl = isPng ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.82);
  return dataUrl.startsWith("data:image") ? dataUrl : null;
}
