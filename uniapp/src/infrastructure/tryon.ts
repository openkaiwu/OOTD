// 虚拟试穿：用 Canvas 把透明底衣物拼到人体剪影上，生成"穿上效果"的搭配模拟图。
// 优先复用识图管线产出的透明底 PNG 缩略图；演示数据（/static 平铺图）惰性抠图并缓存。

import { matteImageToPng } from "./matte";
import { CATEGORIES } from "@/domain/constants";
import type { Garment } from "@/domain/types";

export const TRYON_WIDTH = 600;
export const TRYON_HEIGHT = 900;

const cutoutCache = new Map<string, Promise<Cutout | null>>();

interface Cutout {
  src: string;
  flat: boolean;
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

// 取一件衣物的透明底素材：管线抠图缩略图（PNG data URL）直接用；平铺图惰性抠图。
function cutoutOf(garment: Garment): Promise<Cutout | null> {
  const thumb = garment.thumbnailPath || "";
  if (thumb.startsWith("data:image/png")) return Promise.resolve({ src: thumb, flat: false });
  const source = garment.imagePath || thumb;
  if (!source) return Promise.resolve(null);
  let pending = cutoutCache.get(source);
  if (!pending) {
    pending = matteImageToPng(source, 720).then((png) => (png ? { src: png, flat: false } : null)).catch(() => null);
    cutoutCache.set(source, pending);
  }
  return pending;
}

async function loadCutout(garment: Garment): Promise<{ garment: Garment; image: HTMLImageElement | null; flat: boolean }> {
  const cutout = await cutoutOf(garment);
  if (cutout) {
    const image = await loadImage(cutout.src);
    return { garment, image, flat: cutout.flat };
  }
  // 抠图失败时退回平铺原图（半透明贴图，避免整块矩形盖住人台）
  const source = garment.imagePath || garment.thumbnailPath;
  const image = source ? await loadImage(source) : null;
  return { garment, image, flat: true };
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawMannequin(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = "#E9DED2";
  ctx.strokeStyle = "#C8BAAA";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  // 头
  ctx.beginPath();
  ctx.arc(TRYON_WIDTH / 2, 92, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // 颈
  roundedRect(ctx, 284, 138, 32, 42, 8);
  ctx.fill();
  ctx.stroke();
  // 躯干
  ctx.beginPath();
  ctx.moveTo(204, 168);
  ctx.quadraticCurveTo(TRYON_WIDTH / 2, 152, 396, 168);
  ctx.lineTo(366, 424);
  ctx.quadraticCurveTo(TRYON_WIDTH / 2, 450, 234, 424);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // 双臂
  ctx.lineWidth = 32;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(218, 196);
  ctx.quadraticCurveTo(186, 300, 198, 428);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(382, 196);
  ctx.quadraticCurveTo(414, 300, 402, 428);
  ctx.stroke();
  // 胯部
  roundedRect(ctx, 246, 398, 108, 96, 26);
  ctx.fill();
  ctx.stroke();
  // 双腿
  ctx.lineWidth = 44;
  ctx.beginPath();
  ctx.moveTo(272, 466);
  ctx.lineTo(263, 786);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(328, 466);
  ctx.lineTo(337, 786);
  ctx.stroke();
  // 双脚
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(262, 802, 34, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(338, 802, 34, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 在衣物之上补画双手：让手从袖口伸出、包显得被手拎着。
// 手的位置与人台双臂终点一致（左手 x198、右手 x402，y≈428）。
function drawHands(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = "#E9DED2";
  ctx.strokeStyle = "#C8BAAA";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(198, 428, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(402, 428, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// 计算衣物在透明底素材里的非透明包围盒（去掉平铺照片四周的空白边距）。
// 返回 null 表示素材几乎整张都是衣物（无需裁切，直接用整张）。
// 平铺照片抠图后背景透明，但照片四周往往留有空白边距；若不做这一步，
// cover 会把"照片整张"填进身体区域，衣物本体反而够不到身体边缘，露出人台皮肤。
function garmentBounds(image: HTMLImageElement): { x: number; y: number; w: number; h: number } | null {
  const iw = image.naturalWidth, ih = image.naturalHeight;
  if (!iw || !ih) return null;
  const probe = document.createElement("canvas");
  probe.width = iw;
  probe.height = ih;
  const pctx = probe.getContext("2d", { willReadFrequently: true });
  if (!pctx) return null;
  pctx.drawImage(image, 0, 0);
  const data = pctx.getImageData(0, 0, iw, ih).data;
  let minX = iw, minY = ih, maxX = -1, maxY = -1;
  for (let y = 0; y < ih; y++) {
    for (let x = 0; x < iw; x++) {
      if (data[(y * iw + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0 || maxY < 0) return null;
  const w = maxX - minX + 1, h = maxY - minY + 1;
  if (w > iw * 0.98 && h > ih * 0.98) return null;
  return { x: minX, y: minY, w, h };
}

// 按目标矩形绘制衣物。mode 说明：
// - "contain"：整件衣物等比放入框内居中（不裁切，适合鞋/包等需要看清整件的小件）；
// - "cover"：等比放大填满整框、裁掉溢出（适合上衣/裙/下装等需要覆盖身体区域的衣物）。
// src 为衣物本体在素材内的包围盒（见 garmentBounds），缺省时按整张素材绘制。
function drawFit(ctx: CanvasRenderingContext2D, image: HTMLImageElement, rect: { x: number; y: number; w: number; h: number }, mode: "contain" | "cover" = "contain", src: { x: number; y: number; w: number; h: number } | null = null): void {
  const iw = image.naturalWidth, ih = image.naturalHeight;
  if (!iw || !ih) return;
  const sx = src ? src.x : 0, sy = src ? src.y : 0;
  const sw = src ? src.w : iw, sh = src ? src.h : ih;
  if (mode === "cover") {
    const scale = Math.max(rect.w / sw, rect.h / sh);
    const dw = sw * scale, dh = sh * scale;
    ctx.drawImage(image, sx, sy, sw, sh, rect.x + (rect.w - dw) / 2, rect.y + (rect.h - dh) / 2, dw, dh);
    return;
  }
  const scale = Math.min(rect.w / sw, rect.h / sh);
  const dw = sw * scale, dh = sh * scale;
  ctx.drawImage(image, sx, sy, sw, sh, rect.x + (rect.w - dw) / 2, rect.y + (rect.h - dh) / 2, dw, dh);
}

// 在给定画布上绘制试穿图，返回透明底 PNG data URL。
export async function renderTryOn(garments: Garment[]): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = TRYON_WIDTH;
  canvas.height = TRYON_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 背景渐变 + 地面阴影
  const background = ctx.createLinearGradient(0, 0, 0, TRYON_HEIGHT);
  background.addColorStop(0, "#fdf9fb");
  background.addColorStop(1, "#f2eaf3");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, TRYON_WIDTH, TRYON_HEIGHT);
  ctx.save();
  ctx.fillStyle = "rgba(190,166,180,0.28)";
  ctx.beginPath();
  ctx.ellipse(TRYON_WIDTH / 2, TRYON_HEIGHT - 46, 200, 24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawMannequin(ctx);

  const entries = await Promise.all(garments.map(loadCutout));

  const byGroup: Record<string, typeof entries> = {
    top: [], bottom: [], dress: [], shoes: [], outerwear: [], accessory: [],
  };
  entries.forEach((entry) => {
    const group = CATEGORIES.find((category) => category.id === entry.garment.categoryId)?.group || entry.garment.categoryId;
    if (byGroup[group]) byGroup[group].push(entry);
  });

  const draw = (entry: (typeof entries)[number], rect: { x: number; y: number; w: number; h: number }, mode: "contain" | "cover" = "contain"): void => {
    if (!entry.image) return;
    ctx.save();
    if (entry.flat) ctx.globalAlpha = 0.9;
    // 平铺图整张即照片（无透明边距可裁），跳过包围盒探测
    const src = entry.flat ? null : garmentBounds(entry.image);
    drawFit(ctx, entry.image, rect, mode, src);
    ctx.restore();
  };

  // 分层绘制。贴图矩形按人台解剖对齐（画布 600×900，肩 y≈168，腰 y≈430，
  // 腿 y466-786，脚 y≈787-817，双手在两侧 y≈428）。上衣/裙/外套/下装用 cover
  // 填满身体区域（且先裁掉照片空白边距，见 garmentBounds）；鞋/包用 contain
  // 保证整件可见。
  // 连衣裙自带上下身：存在连衣裙时不再叠加独立上衣/下装，避免"上衣混进夏装"。
  const hasDress = byGroup.dress.length > 0;
  if (!hasDress) {
    byGroup.bottom.forEach((entry) => {
      const isPants = entry.garment.categoryId === "pants";
      draw(entry, isPants ? { x: 228, y: 428, w: 144, h: 352 } : { x: 214, y: 416, w: 172, h: 256 }, "cover");
    });
  }
  byGroup.dress.forEach((entry) => draw(entry, { x: 196, y: 150, w: 208, h: 520 }, "cover"));
  if (!hasDress) byGroup.top.forEach((entry) => draw(entry, { x: 192, y: 164, w: 216, h: 268 }, "cover"));
  byGroup.outerwear.forEach((entry) => draw(entry, { x: 188, y: 148, w: 224, h: 344 }, "cover"));
  // 鞋子对齐双脚（左脚 x≈262、右脚 x≈338，脚面 y≈787-817），整只可见
  byGroup.shoes.forEach((entry) => {
    draw(entry, { x: 218, y: 758, w: 88, h: 62 });
    draw(entry, { x: 294, y: 758, w: 88, h: 62 });
  });
  // 配饰（包）挂在右手边、从手的高度垂下：上缘略高于手（y≈428），让右手搭在包把手上
  byGroup.accessory.forEach((entry) => draw(entry, { x: 340, y: 396, w: 120, h: 190 }));
  // 手最后画：从袖口伸出，右手搭在包上，让"拎包"更直观
  drawHands(ctx);

  const dataUrl = canvas.toDataURL("image/png");
  return dataUrl.startsWith("data:image") ? dataUrl : null;
}
