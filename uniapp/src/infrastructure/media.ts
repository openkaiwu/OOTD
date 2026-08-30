import { dominantColorFromPixels, guessCategory, guessSeasons } from "@/domain/recognition";
import type { ProcessingDraftItem } from "@/domain/types";
import type { FileStorePort, MediaPickerPort, MediaSource } from "@/domain/ports";
import { idGeneratorPort } from "./platform";
import { enhanceImage } from "./enhance";
import { getLlmSettings, llmRecognize } from "./llm";

export type DraftProgressUpdate = Pick<ProcessingDraftItem, "status" | "progress">;
export type DraftProgressListener = (update: DraftProgressUpdate) => void;

// 抠图全图（PNG data URL）的最大字符数预算：超过则回退保存原图全图，避免撑爆本地存储
const MATTE_FULL_BUDGET_CHARS = 550_000;

interface UniFailureLike { errMsg?: string }

interface NativeCameraBridge { capturePhoto?: (requestId: string) => boolean }
type NativeCameraResult = (requestId: string, dataUrl: string, error?: string) => void;
const nativeCameraRequests = new Map<string, { resolve: (paths: string[]) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
let nativeCameraCallbackReady = false;

function nativeCameraBridge(): NativeCameraBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { OOTDNative?: NativeCameraBridge }).OOTDNative;
}

function ensureNativeCameraCallback(): void {
  if (nativeCameraCallbackReady || typeof window === "undefined") return;
  (window as unknown as { __ootdCameraResult?: NativeCameraResult }).__ootdCameraResult = (requestId, dataUrl, error) => {
    const pending = nativeCameraRequests.get(requestId);
    if (!pending) return;
    nativeCameraRequests.delete(requestId);
    clearTimeout(pending.timer);
    if (dataUrl) pending.resolve([dataUrl]);
    else pending.reject(new Error(error || "camera capture failed"));
  };
  nativeCameraCallbackReady = true;
}

function captureWithNativeCamera(): Promise<string[]> {
  const bridge = nativeCameraBridge();
  if (!bridge?.capturePhoto) return Promise.reject(new Error("native camera unavailable"));
  ensureNativeCameraCallback();
  const requestId = `camera_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      nativeCameraRequests.delete(requestId);
      reject(new Error("camera capture timed out"));
    }, 90_000);
    nativeCameraRequests.set(requestId, { resolve, reject, timer });
    try {
      if (!bridge.capturePhoto?.(requestId)) {
        nativeCameraRequests.delete(requestId);
        clearTimeout(timer);
        reject(new Error("camera unavailable"));
      }
    } catch (error) {
      nativeCameraRequests.delete(requestId);
      clearTimeout(timer);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

function getImageInfo(src: string): Promise<UniApp.GetImageInfoSuccessData> {
  return new Promise((resolve, reject) => uni.getImageInfo({ src, success: resolve, fail: reject }));
}

function compress(src: string, quality: number, maxEdge: number, info: UniApp.GetImageInfoSuccessData): Promise<string> {
  const scale = Math.min(1, maxEdge / Math.max(info.width, info.height));
  const compressedWidth = Math.max(1, Math.round(info.width * scale));
  const compressedHeight = Math.max(1, Math.round(info.height * scale));
  return new Promise((resolve) => {
    try {
      uni.compressImage({ src, quality, compressedWidth, compressedHeight, success: (result) => resolve(result.tempFilePath), fail: () => resolve(src) });
    } catch {
      resolve(src);
    }
  });
}

function persist(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.saveFile({ tempFilePath: src, success: (result) => resolve(result.savedFilePath), fail: reject });
  });
}

async function persistDurably(src: string): Promise<string> {
  try {
    return await persist(src);
  } catch (error) {
    // H5 的对象 URL 只用于浏览器预览；App 和小程序必须持久化成功，避免重启后图片失效。
    // #ifdef H5
    return src;
    // #endif
    throw error;
  }
}

function chooseWithImageApi(source: MediaSource, count: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: source === "camera" ? 1 : count,
      sourceType: [source],
      sizeType: ["original"],
      success: (result) => resolve(Array.isArray(result.tempFilePaths) ? result.tempFilePaths : [result.tempFilePaths]),
      fail: reject,
    });
  });
}

function chooseWithMediaApi(source: MediaSource, count: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseMedia({
      count: source === "camera" ? 1 : count,
      mediaType: ["image"],
      sourceType: [source],
      sizeType: ["original"],
      camera: "back",
      success: (result) => resolve(result.tempFiles.map((item) => item.tempFilePath)),
      fail: reject,
    });
  });
}

function errorMessage(error: unknown): string {
  if (error && typeof error === "object" && "errMsg" in error) return String((error as UniFailureLike).errMsg || "");
  if (error instanceof Error) return error.message;
  return String(error || "");
}

export function isMediaSelectionCancelled(error: unknown): boolean {
  return /cancel|取消/i.test(errorMessage(error));
}

export function isMediaPermissionDenied(error: unknown): boolean {
  return /auth deny|authorize|permission|denied|unauthorized|权限/i.test(errorMessage(error));
}

export function chooseImages(source: MediaSource, count: number): Promise<string[]> {
  const safeCount = Math.max(1, Math.min(9, count));
  if (source === "camera" && nativeCameraBridge()?.capturePhoto) return captureWithNativeCamera();
  // uni.chooseMedia 在 H5 不可用；浏览器预览使用 chooseImage，App 与微信使用新版系统媒体选择器。
  // 统一取原图：系统压缩在源头损失细节，尺寸控制交给下方增强/压缩管线。
  // #ifdef H5
  return chooseWithImageApi(source, safeCount);
  // #endif
  // #ifndef H5
  return chooseWithMediaApi(source, safeCount);
  // #endif
}

export async function prepareDraftItem(sourcePath: string, onProgress?: DraftProgressListener, existingId?: string): Promise<ProcessingDraftItem> {
  const id = existingId || idGeneratorPort.create("draft");
  let phase = "读取图片";
  let savedImagePath = "";
  let savedThumbnailPath = "";
  let savedOriginalPath = "";
  let savedOriginalThumbnailPath = "";
  let mattePath = "";
  let matteThumbnailPath = "";
  let matted = false;
  const report = (status: DraftProgressUpdate["status"], progress: number): void => onProgress?.({ status, progress });

  try {
    report("compressing", 8);
    const info = await getImageInfo(sourcePath);

    // H5/WebView：Canvas 增强管线（高质量降采样 + 白平衡 + 对比度 + 锐化），
    // 同时产出缩略图、AI 识别用小图和主色采样像素；其余平台回退系统压缩。
    phase = "增强图片";
    report("compressing", 28);
    const enhanced = await enhanceImage(sourcePath);
    if (enhanced) {
      phase = "保存图片";
      report("persisting", 46);
      // 未抠图版本（JPEG）与抠图版本（PNG）都保留，确认页可切换"原图/去背景"
      savedOriginalPath = await persistDurably(enhanced.originalPath || enhanced.path);
      savedOriginalThumbnailPath = await persistDurably(enhanced.originalThumbnail || enhanced.thumbnail);
      if (enhanced.matted) {
        mattePath = await persistDurably(enhanced.path);
        matteThumbnailPath = await persistDurably(enhanced.thumbnail);
        matted = true;
      }
      report("compressing", 66);
      // 默认保存：抠图全图体积可接受就用透明底全图，否则回退原图全图（缩略图仍用抠图 PNG）
      if (mattePath && mattePath.length <= MATTE_FULL_BUDGET_CHARS) {
        savedImagePath = mattePath;
        savedThumbnailPath = matteThumbnailPath || savedOriginalThumbnailPath;
      } else {
        savedImagePath = savedOriginalPath;
        savedThumbnailPath = matteThumbnailPath || savedOriginalThumbnailPath;
      }
    } else {
      phase = "压缩图片";
      const compressedPath = await compress(sourcePath, 85, 1600, info);
      phase = "保存原图";
      report("persisting", 46);
      savedImagePath = await persistDurably(compressedPath);
      phase = "生成缩略图";
      report("compressing", 66);
      const persistedInfo = await getImageInfo(savedImagePath);
      const thumbnailTempPath = await compress(savedImagePath, 75, 360, persistedInfo);
      report("persisting", 78);
      savedThumbnailPath = await persistDurably(thumbnailTempPath);
    }

    phase = "识别衣物";
    report("recognizing", 90);
    const width = enhanced?.width || info.width;
    const height = enhanced?.height || info.height;
    const categoryId = guessCategory(width, height);
    let colorHex = "#8A8A8A";
    let colorName = "灰色";
    let tags = ["本地扫描", "请确认"];
    if (enhanced) {
      const named = dominantColorFromPixels(enhanced.colorPixels);
      colorHex = named.hex;
      colorName = named.name;
      tags = ["本地识别", "请确认"];
    }
    const item: ProcessingDraftItem = {
      id,
      sourcePath,
      persistedPath: savedImagePath,
      thumbnailPath: savedThumbnailPath,
      status: "review",
      progress: 100,
      confirmed: false,
      matted,
      mattePath: mattePath || undefined,
      matteThumbnailPath: matteThumbnailPath || undefined,
      originalPath: savedOriginalPath || undefined,
      originalThumbnailPath: savedOriginalThumbnailPath || undefined,
      suggestion: {
        name: `未命名${categoryId === "dress" ? "连衣裙" : categoryId === "shoes" ? "鞋子" : "单品"}`,
        categoryId,
        colorHex,
        colorName,
        seasonIds: guessSeasons(categoryId),
        styleIds: [],
        sceneIds: [],
        tags,
      },
    };

    // 大模型识图：启用且配置了 Key 时用 MiMo 视觉模型覆盖本地猜测，失败静默回退
    const llm = getLlmSettings();
    if (llm.enabled && llm.apiKey && enhanced?.base64) {
      const ai = await llmRecognize(enhanced.base64);
      if (ai) {
        item.suggestion = {
          ...item.suggestion,
          ...ai,
          tags: [...new Set([...(ai.tags || []), "AI 识别"])].slice(0, 4),
        };
      }
    }

    report("review", 100);
    return item;
  } catch {
    const cleaned = new Set<string>();
    for (const path of [savedThumbnailPath, savedImagePath, savedOriginalPath, savedOriginalThumbnailPath, matteThumbnailPath, mattePath]) {
      if (!path || cleaned.has(path)) continue;
      cleaned.add(path);
      await removeSavedFile(path);
    }
    return {
      id,
      sourcePath,
      persistedPath: "",
      thumbnailPath: "",
      status: "failed",
      progress: 0,
      confirmed: false,
      error: `${phase}失败，请重试`,
    };
  }
}

export function removeSavedFile(path: string): Promise<void> {
  if (!path || path.startsWith("/static/") || path.startsWith("data:")) return Promise.resolve();
  return new Promise((resolve) => uni.removeSavedFile({ filePath: path, complete: () => resolve() }));
}

export const mediaPickerPort: MediaPickerPort = { choose: chooseImages };
export const fileStorePort: FileStorePort = { prepare: prepareDraftItem, remove: removeSavedFile };
