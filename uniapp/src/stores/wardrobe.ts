import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Garment, ProcessingDraft, ProcessingDraftItem } from "@/domain/types";
import { repositories } from "@/infrastructure/repositories";
import { removeSavedFile } from "@/infrastructure/media";
import { logEvent } from "@/infrastructure/events";
import { hapticsPort } from "@/infrastructure/platform";

export const useWardrobeStore = defineStore("wardrobe", () => {
  const DELETE_UNDO_MS = 5000;
  const garments = ref<Garment[]>([]);
  const draft = ref<ProcessingDraft | null>(null);
  const pendingDeleteNotice = ref<{ ids: string[]; names: string[]; expiresAt: number } | null>(null);
  const pendingDeletes = new Map<string, ReturnType<typeof setTimeout>>();
  const activeGarments = computed(() => garments.value.filter((item) => item.availability === "active" && !item.deletedAt));

  function hydrate(): void {
    garments.value = repositories.listGarments();
    draft.value = repositories.getDraft();
    const now = Date.now();
    const recoverable = garments.value.filter((item) => item.deletedAt && now - item.deletedAt < DELETE_UNDO_MS);
    const stale = garments.value.filter((item) => item.deletedAt && now - item.deletedAt >= DELETE_UNDO_MS);
    recoverable.forEach((item) => {
      if (pendingDeletes.has(item.id)) return;
      scheduleCleanup(item.id, Math.max(1, DELETE_UNDO_MS - (now - item.deletedAt!)));
    });
    if (recoverable.length) updateDeleteNotice(recoverable.map((item) => item.id));
    stale.forEach((item) => { void finalizeDelete(item.id); });
  }

  function persist(): void { repositories.saveGarments(garments.value); }

  // 草稿体积触发阈值（字符数）：WebView localStorage 单键上限约 4.4MB，这里约为上限一半。
  // 超预算时丢弃可选大字段，避免把超大草稿写进 localStorage 抛 QuotaExceeded 导致导入中断。
  const DRAFT_BUDGET_CHARS = 1_900_000;
  // 仍超此阈值时进一步丢弃抠图全图（mattePath），确保多件大图也写得进单键存储。
  const DRAFT_HARD_CHARS = 3_200_000;

  // 快速估算草稿体积：只累加字符串字段长度，避免为每次保存做整份 JSON.stringify（那本身就会卡主线程）。
  function estimateDraftChars(items: ProcessingDraftItem[]): number {
    let total = 0;
    const textKeys: (keyof ProcessingDraftItem)[] = [
      "sourcePath", "persistedPath", "thumbnailPath", "error",
      "mattePath", "matteThumbnailPath", "originalPath", "originalThumbnailPath",
      "cropPath", "cropThumbnailPath",
    ];
    for (const item of items) {
      for (const key of textKeys) {
        const value = item[key];
        if (typeof value === "string") total += value.length;
      }
      if (item.suggestion) total += JSON.stringify(item.suggestion).length;
      total += 300; // 每条固定开销（id、字段名、枚举等）
    }
    return total;
  }

  // 超预算时逐件丢弃可选大字段：原图对比（originalPath/originalThumbnailPath）与
  // 抠图缩略图（matteThumbnailPath，与 thumbnailPath 本就是同一张图）。
  // 主图、缩略图、抠图全图、手动裁剪结果都保留，校对页与入衣橱核心流程不受影响。
  // severe 模式下连抠图全图也丢：校对页的"去背景"开关会因 mattePath 缺失自动回退主图，仍可用。
  function trimDraftForBudget(items: ProcessingDraftItem[], severe: boolean): ProcessingDraftItem[] {
    return items.map((item) => ({
      ...item,
      originalPath: undefined,
      originalThumbnailPath: undefined,
      matteThumbnailPath: undefined,
      ...(severe ? { mattePath: undefined } : {}),
    }));
  }

  function saveDraftItems(items: ProcessingDraftItem[], entry = "unknown"): void {
    const now = Date.now();
    const baseId = draft.value?.id || `draft_${now}`;
    const createdAt = draft.value?.createdAt || now;
    let next = items;
    const size = estimateDraftChars(items);
    if (size > DRAFT_HARD_CHARS) next = trimDraftForBudget(items, true);
    else if (size > DRAFT_BUDGET_CHARS) next = trimDraftForBudget(items, false);
    draft.value = { id: baseId, entry, items: next, createdAt, updatedAt: now, schemaVersion: 1 };
    repositories.saveDraft(draft.value);
  }

  function clearDraft(): void { draft.value = null; repositories.clearDraft(); }

  function addBatch(items: Garment[]): void {
    garments.value = [...garments.value, ...items];
    persist();
    clearDraft();
    logEvent("garment_batch_added", { count: items.length });
  }

  function update(item: Garment): void {
    const index = garments.value.findIndex((current) => current.id === item.id);
    if (index < 0) return;
    garments.value[index] = { ...item, updatedAt: Date.now() };
    persist();
    logEvent("garment_updated", { category: item.categoryId });
  }

  function toggleFavorite(id: string): void {
    const item = garments.value.find((current) => current.id === id);
    if (!item) return;
    item.favorite = !item.favorite;
    item.updatedAt = Date.now();
    persist();
    hapticsPort.tap();
    logEvent("garment_favorite_toggled", { favorite: item.favorite });
  }

  function setFavorites(ids: string[], favorite: boolean): void {
    let changed = 0;
    garments.value.forEach((item) => {
      if (!ids.includes(item.id) || item.favorite === favorite) return;
      item.favorite = favorite;
      item.updatedAt = Date.now();
      changed += 1;
    });
    if (!changed) return;
    persist();
    hapticsPort.tap();
    logEvent("garment_batch_favorite", { favorite, count: changed });
  }

  function updateDeleteNotice(ids: string[], expiresAt = Date.now() + DELETE_UNDO_MS): void {
    const currentIds = pendingDeleteNotice.value?.ids.filter((id) => pendingDeletes.has(id)) || [];
    const nextIds = [...new Set([...currentIds, ...ids])].filter((id) => pendingDeletes.has(id));
    if (!nextIds.length) { pendingDeleteNotice.value = null; return; }
    pendingDeleteNotice.value = {
      ids: nextIds,
      names: nextIds.map((id) => garments.value.find((item) => item.id === id)?.name).filter((name): name is string => Boolean(name)),
      expiresAt,
    };
  }

  function scheduleCleanup(id: string, cleanupDelay: number): void {
    const existing = pendingDeletes.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(async () => {
      await finalizeDelete(id);
    }, cleanupDelay);
    pendingDeletes.set(id, timer);
  }

  async function finalizeDelete(id: string): Promise<void> {
    const target = garments.value.find((current) => current.id === id);
    pendingDeletes.delete(id);
    if (!target?.deletedAt) { updateDeleteNotice([]); return; }
    garments.value = garments.value.filter((current) => current.id !== id);
    persist();
    await removeSavedFile(target.imagePath);
    if (target.thumbnailPath !== target.imagePath) await removeSavedFile(target.thumbnailPath);
    if (pendingDeleteNotice.value) {
      pendingDeleteNotice.value.ids = pendingDeleteNotice.value.ids.filter((current) => current !== id);
      updateDeleteNotice([]);
    }
    logEvent("garment_delete_finalized", { count: 1 });
  }

  function softDeleteMany(ids: string[], cleanupDelay = DELETE_UNDO_MS): Garment[] {
    const idSet = new Set(ids);
    const targets = garments.value.filter((item) => idSet.has(item.id) && !item.deletedAt);
    if (!targets.length) return [];
    const deletedAt = Date.now();
    targets.forEach((item) => {
      item.deletedAt = deletedAt;
      item.availability = "archived";
      item.updatedAt = deletedAt;
      scheduleCleanup(item.id, cleanupDelay);
    });
    persist();
    updateDeleteNotice(targets.map((item) => item.id), deletedAt + cleanupDelay);
    hapticsPort.tap();
    logEvent("garment_soft_deleted", { count: targets.length });
    return targets;
  }

  function softDelete(id: string, cleanupDelay = DELETE_UNDO_MS): void {
    softDeleteMany([id], cleanupDelay);
  }

  function restoreMany(ids = pendingDeleteNotice.value?.ids || []): number {
    const idSet = new Set(ids);
    let restored = 0;
    ids.forEach((id) => {
      const timer = pendingDeletes.get(id);
      if (timer) clearTimeout(timer);
      pendingDeletes.delete(id);
    });
    garments.value.forEach((item) => {
      if (!idSet.has(item.id) || !item.deletedAt) return;
      item.deletedAt = undefined;
      item.availability = "active";
      item.updatedAt = Date.now();
      restored += 1;
    });
    if (!restored) return 0;
    persist();
    if (pendingDeleteNotice.value) {
      pendingDeleteNotice.value.ids = pendingDeleteNotice.value.ids.filter((id) => !idSet.has(id));
      updateDeleteNotice([]);
    }
    hapticsPort.tap();
    logEvent("garment_delete_undone", { count: restored });
    return restored;
  }

  function restore(id: string): void {
    restoreMany([id]);
  }

  function markItemsWorn(ids: string[], wornAt = Date.now()): void {
    garments.value.forEach((item) => {
      if (ids.includes(item.id)) {
        item.wearCount += 1;
        item.lastWornAt = wornAt;
        item.updatedAt = wornAt;
      }
    });
    persist();
    logEvent("wear_record_added", { garmentCount: ids.length });
  }

  function cancelDeleteTimers(): void {
    pendingDeletes.forEach((timer) => clearTimeout(timer));
    pendingDeletes.clear();
    pendingDeleteNotice.value = null;
  }

  function replaceAll(items: Garment[]): void { cancelDeleteTimers(); garments.value = items; persist(); }
  function clearAll(): void { cancelDeleteTimers(); garments.value = []; draft.value = null; repositories.clearAll(); }

  return { garments, activeGarments, draft, pendingDeleteNotice, hydrate, saveDraftItems, clearDraft, addBatch, update, toggleFavorite, setFavorites, softDelete, softDeleteMany, restore, restoreMany, markItemsWorn, replaceAll, clearAll };
});
