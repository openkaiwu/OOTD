import type { BackupArchiveInfo, BackupArchiveResult, BackupAsset, BackupManifest, Garment, Outfit } from "@/domain/types";
import type { BackupPort } from "@/domain/ports";
import { repositories } from "./repositories";

interface PlusError { message?: string }
interface PlusEntry {
  name: string;
  fullPath: string;
  isDirectory: boolean;
  isFile: boolean;
  toLocalURL(): string;
  copyTo(parent: PlusDirectoryEntry, newName: string, success: (entry: PlusEntry) => void, fail: (error: PlusError) => void): void;
  remove(success: () => void, fail: (error: PlusError) => void): void;
}
interface PlusDirectoryEntry extends PlusEntry {
  getDirectory(name: string, options: { create: boolean }, success: (entry: PlusDirectoryEntry) => void, fail: (error: PlusError) => void): void;
  getFile(name: string, options: { create: boolean }, success: (entry: PlusFileEntry) => void, fail: (error: PlusError) => void): void;
  createReader(): { readEntries(success: (entries: PlusEntry[]) => void, fail: (error: PlusError) => void): void };
  removeRecursively(success: () => void, fail: (error: PlusError) => void): void;
}
interface PlusFileEntry extends PlusEntry {
  file(success: (file: { size: number }) => void, fail: (error: PlusError) => void): void;
  createWriter(success: (writer: { onwrite: (() => void) | null; onerror: ((error: PlusError) => void) | null; write(value: string): void }) => void, fail: (error: PlusError) => void): void;
}

declare const plus: {
  io: {
    resolveLocalFileSystemURL(path: string, success: (entry: PlusEntry) => void, fail: (error: PlusError) => void): void;
    FileReader: new () => { result: string; onloadend: (() => void) | null; onerror: ((error: PlusError) => void) | null; readAsText(file: unknown, encoding: string): void };
  };
  zip: {
    compress(source: string, destination: string, success: () => void, fail: (error: PlusError) => void): void;
    decompress(source: string, destination: string, success: () => void, fail: (error: PlusError) => void): void;
  };
  share: { sendWithSystem(options: { content: string; files?: string[] }, success: () => void, fail: (error: PlusError) => void): void };
};

export interface BackupImportPlan {
  newGarments: number;
  garmentConflicts: number;
  newOutfits: number;
  outfitConflicts: number;
}

export function createBackup(): BackupManifest {
  return {
    product: "ootd-uniapp",
    version: 2,
    exportedAt: Date.now(),
    garments: repositories.listGarments(),
    outfits: repositories.listOutfits(),
    profile: repositories.getProfile(),
    preferences: repositories.getPreferences(),
    appMeta: repositories.getAppMeta(),
    assets: [],
  };
}

export function validateBackup(value: unknown): value is BackupManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<BackupManifest>;
  return manifest.product === "ootd-uniapp"
    && (manifest.version === 1 || manifest.version === 2)
    && typeof manifest.exportedAt === "number"
    && Array.isArray(manifest.garments)
    && Array.isArray(manifest.outfits)
    && Boolean(manifest.profile)
    && Boolean(manifest.preferences)
    && (manifest.appMeta === undefined || (["dream", "ins", "forest"].includes(manifest.appMeta.themeId) && Array.isArray(manifest.appMeta.localFeedback)))
    && (manifest.assets === undefined || Array.isArray(manifest.assets));
}

export function inspectBackupImport(currentGarments: Garment[], currentOutfits: Outfit[], backup: BackupManifest): BackupImportPlan {
  const garmentIds = new Set(currentGarments.map((item) => item.id));
  const outfitIds = new Set(currentOutfits.map((item) => item.id));
  return {
    newGarments: backup.garments.filter((item) => !garmentIds.has(item.id)).length,
    garmentConflicts: backup.garments.filter((item) => garmentIds.has(item.id)).length,
    newOutfits: backup.outfits.filter((item) => !outfitIds.has(item.id)).length,
    outfitConflicts: backup.outfits.filter((item) => outfitIds.has(item.id)).length,
  };
}

export function mergeBackupItems<T extends { id: string }>(current: T[], incoming: T[], replaceConflicts: boolean): T[] {
  if (!replaceConflicts) {
    const currentIds = new Set(current.map((item) => item.id));
    return [...current, ...incoming.filter((item) => !currentIds.has(item.id))];
  }
  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...incoming, ...current.filter((item) => !incomingIds.has(item.id))];
}

export function exportBackupToClipboard(): Promise<number> {
  const backup = createBackup();
  return new Promise((resolve, reject) => uni.setClipboardData({ data: JSON.stringify(backup), success: () => resolve(backup.garments.length), fail: reject }));
}

export function readBackupFromClipboard(): Promise<BackupManifest> {
  return new Promise((resolve, reject) => uni.getClipboardData({
    success: (result) => {
      try {
        const parsed = JSON.parse(result.data);
        if (!validateBackup(parsed)) throw new Error("备份格式不正确");
        resolve(parsed);
      } catch (error) { reject(error); }
    },
    fail: reject,
  }));
}

export function supportsFullBackupArchive(): boolean {
  let supported = false;
  // #ifdef APP-PLUS
  supported = typeof plus !== "undefined" && Boolean(plus.io && plus.zip);
  // #endif
  return supported;
}

function plusError(error: PlusError, fallback: string): Error {
  return new Error(error?.message || fallback);
}

function resolveEntry(path: string): Promise<PlusEntry> {
  return new Promise((resolve, reject) => plus.io.resolveLocalFileSystemURL(path, resolve, (error) => reject(plusError(error, `无法访问文件：${path}`))));
}

function getDirectory(parent: PlusDirectoryEntry, name: string): Promise<PlusDirectoryEntry> {
  return new Promise((resolve, reject) => parent.getDirectory(name, { create: true }, resolve, (error) => reject(plusError(error, `无法创建目录：${name}`))));
}

function getFile(parent: PlusDirectoryEntry, name: string): Promise<PlusFileEntry> {
  return new Promise((resolve, reject) => parent.getFile(name, { create: true }, resolve, (error) => reject(plusError(error, `无法创建文件：${name}`))));
}

function writeText(parent: PlusDirectoryEntry, name: string, value: string): Promise<void> {
  return getFile(parent, name).then((entry) => new Promise((resolve, reject) => entry.createWriter((writer) => {
    writer.onwrite = resolve;
    writer.onerror = (error) => reject(plusError(error, `无法写入文件：${name}`));
    writer.write(value);
  }, (error) => reject(plusError(error, `无法写入文件：${name}`)) )));
}

function readText(entry: PlusFileEntry): Promise<string> {
  return new Promise((resolve, reject) => entry.file((file) => {
    const reader = new plus.io.FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = (error) => reject(plusError(error, `无法读取文件：${entry.name}`));
    reader.readAsText(file, "utf-8");
  }, (error) => reject(plusError(error, `无法读取文件：${entry.name}`))));
}

function copyEntry(source: PlusEntry, parent: PlusDirectoryEntry, name: string): Promise<PlusEntry> {
  return new Promise((resolve, reject) => source.copyTo(parent, name, resolve, (error) => reject(plusError(error, `无法复制文件：${source.name}`))));
}

function removeDirectory(entry: PlusDirectoryEntry): Promise<void> {
  return new Promise((resolve) => entry.removeRecursively(resolve, () => resolve()));
}

function normalizeLocalPath(path: string): string {
  if (path.startsWith("/static/")) return `_www${path}`;
  return path;
}

function extensionOf(path: string): string {
  return path.match(/\.(jpe?g|png|webp|gif)$/i)?.[0].toLowerCase() || ".jpg";
}

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
}

function compress(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => plus.zip.compress(source, destination, resolve, (error) => reject(plusError(error, "备份压缩失败"))));
}

function decompress(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => plus.zip.decompress(source, destination, resolve, (error) => reject(plusError(error, "备份解压失败"))));
}

async function readDirectory(entry: PlusDirectoryEntry): Promise<PlusEntry[]> {
  const reader = entry.createReader();
  const all: PlusEntry[] = [];
  while (true) {
    const batch = await new Promise<PlusEntry[]>((resolve, reject) => reader.readEntries(resolve, (error) => reject(plusError(error, "无法读取备份目录"))));
    if (!batch.length) break;
    all.push(...batch);
  }
  return all;
}

async function findFile(entry: PlusDirectoryEntry, name: string, depth = 0): Promise<PlusFileEntry | null> {
  const entries = await readDirectory(entry);
  const exact = entries.find((item) => item.isFile && item.name === name);
  if (exact) return exact as PlusFileEntry;
  if (depth >= 3) return null;
  for (const child of entries.filter((item) => item.isDirectory)) {
    const found = await findFile(child as PlusDirectoryEntry, name, depth + 1);
    if (found) return found;
  }
  return null;
}

function parentPath(path: string): string {
  return path.slice(0, path.lastIndexOf("/") + 1);
}

export async function exportFullBackupArchive(): Promise<BackupArchiveResult> {
  if (!supportsFullBackupArchive()) throw new Error("完整图片备份仅在 Android 正式 App 中可用");
  const timestamp = Date.now();
  const docRoot = await resolveEntry("_doc/") as PlusDirectoryEntry;
  const documentsRoot = await resolveEntry("_documents/") as PlusDirectoryEntry;
  const archiveDirectory = await getDirectory(documentsRoot, "明天穿什么备份");
  const stage = await getDirectory(docRoot, `ootd-backup-stage-${timestamp}`);
  const imageDirectory = await getDirectory(stage, "images");
  const manifest = createBackup();
  const assets: BackupAsset[] = [];
  const copiedPaths = new Map<string, string>();

  try {
    for (const garment of manifest.garments) {
      for (const [kind, rawPath] of [["image", garment.imagePath], ["thumbnail", garment.thumbnailPath]] as const) {
        if (!rawPath) continue;
        let archivePath = copiedPaths.get(rawPath);
        if (!archivePath) {
          try {
            const source = await resolveEntry(normalizeLocalPath(rawPath));
            const filename = `${safeName(garment.id)}-${kind}${extensionOf(rawPath)}`;
            await copyEntry(source, imageDirectory, filename);
            archivePath = `images/${filename}`;
            copiedPaths.set(rawPath, archivePath);
          } catch {
            continue;
          }
        }
        assets.push({ garmentId: garment.id, kind, archivePath });
      }
    }
    manifest.assets = assets;
    await writeText(stage, "manifest.json", JSON.stringify(manifest));
    const name = `ootd-backup-${timestamp}.zip`;
    const path = `${archiveDirectory.toLocalURL()}${archiveDirectory.toLocalURL().endsWith("/") ? "" : "/"}${name}`;
    await compress(stage.toLocalURL(), path);
    return { name, path, createdAt: timestamp, garmentCount: manifest.garments.length, imageCount: new Set(assets.map((item) => item.archivePath)).size };
  } finally {
    await removeDirectory(stage);
  }
}

export async function listFullBackupArchives(): Promise<BackupArchiveInfo[]> {
  if (!supportsFullBackupArchive()) return [];
  const documentsRoot = await resolveEntry("_documents/") as PlusDirectoryEntry;
  const archiveDirectory = await getDirectory(documentsRoot, "明天穿什么备份");
  return (await readDirectory(archiveDirectory))
    .filter((item) => item.isFile && /^ootd-backup-\d+\.zip$/i.test(item.name))
    .map((item) => ({ name: item.name, path: item.toLocalURL(), createdAt: Number(item.name.match(/\d+/)?.[0] || 0) }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function importFullBackupArchive(path: string): Promise<BackupManifest> {
  if (!supportsFullBackupArchive()) throw new Error("完整图片恢复仅在 Android 正式 App 中可用");
  const timestamp = Date.now();
  const docRoot = await resolveEntry("_doc/") as PlusDirectoryEntry;
  const restoreDirectory = await getDirectory(docRoot, `ootd-backup-restore-${timestamp}`);
  const libraryRoot = await getDirectory(docRoot, "ootd-restored-images");
  const libraryDirectory = await getDirectory(libraryRoot, String(timestamp));

  try {
    await decompress(path, restoreDirectory.toLocalURL());
    const manifestFile = await findFile(restoreDirectory, "manifest.json");
    if (!manifestFile) throw new Error("备份包缺少 manifest.json");
    const parsed = JSON.parse(await readText(manifestFile));
    if (!validateBackup(parsed)) throw new Error("备份清单格式不正确");
    const manifest = parsed as BackupManifest;
    const manifestRoot = await resolveEntry(parentPath(manifestFile.toLocalURL())) as PlusDirectoryEntry;
    const restored = new Map<string, Partial<Record<BackupAsset["kind"], string>>>();

    for (const asset of manifest.assets || []) {
      try {
        const base = manifestRoot.toLocalURL();
        const source = await resolveEntry(`${base}${base.endsWith("/") ? "" : "/"}${asset.archivePath}`);
        const copied = await copyEntry(source, libraryDirectory, `${safeName(asset.garmentId)}-${asset.kind}${extensionOf(asset.archivePath)}`);
        restored.set(asset.garmentId, { ...restored.get(asset.garmentId), [asset.kind]: copied.toLocalURL() });
      } catch {
        continue;
      }
    }
    manifest.garments = manifest.garments.map((garment) => {
      const paths = restored.get(garment.id);
      if (!paths) return garment;
      return { ...garment, imagePath: paths.image || garment.imagePath, thumbnailPath: paths.thumbnail || paths.image || garment.thumbnailPath };
    });
    return manifest;
  } finally {
    await removeDirectory(restoreDirectory);
  }
}

export function shareBackupArchive(path: string): Promise<void> {
  if (!supportsFullBackupArchive()) return Promise.reject(new Error("系统分享仅在 Android 正式 App 中可用"));
  return new Promise((resolve, reject) => plus.share.sendWithSystem({ content: "明天穿什么 · 完整本地备份", files: [path] }, resolve, (error) => reject(plusError(error, "分享备份失败"))));
}

export const backupPort: BackupPort = {
  create: createBackup,
  exportMetadata: exportBackupToClipboard,
  importMetadata: readBackupFromClipboard,
  supportsFullArchive: supportsFullBackupArchive,
  exportArchive: exportFullBackupArchive,
  listArchives: listFullBackupArchives,
  importArchive: importFullBackupArchive,
};
