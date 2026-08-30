import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { DislikeReason, Outfit } from "@/domain/types";
import { repositories } from "@/infrastructure/repositories";
import { outfitSignature } from "@/domain/recommendation";
import { logEvent } from "@/infrastructure/events";

export const useOutfitStore = defineStore("outfits", () => {
  const outfits = ref<Outfit[]>([]);
  const latestRecommendations = ref<Outfit[]>([]);
  const saved = computed(() => outfits.value.filter((item) => item.saved));

  function hydrate(): void {
    outfits.value = repositories.listOutfits();
    if (!latestRecommendations.value.length) latestRecommendations.value = outfits.value.slice(0, 3);
  }
  function persist(): void { repositories.saveOutfits(outfits.value); }
  function setRecommendations(items: Outfit[]): void {
    latestRecommendations.value = items;
    const incomingIds = new Set(items.map((item) => item.id));
    outfits.value = [...items.map((item) => ({ ...item })), ...outfits.value.filter((item) => !incomingIds.has(item.id))].slice(0, 300);
    persist();
    logEvent("outfits_generated", { count: items.length, source: items[0]?.contextSnapshot.source || "unknown" });
  }

  function merge(item: Outfit): void {
    const index = outfits.value.findIndex((current) => current.id === item.id);
    if (index >= 0) outfits.value[index] = item;
    else outfits.value.unshift(item);
    persist();
  }

  function toggleSave(item: Outfit): boolean {
    const signature = outfitSignature(item.itemIds);
    const duplicate = outfits.value.find((current) => current.saved && outfitSignature(current.itemIds) === signature && current.id !== item.id);
    if (duplicate && !item.saved) return false;
    item.saved = !item.saved;
    item.updatedAt = Date.now();
    merge({ ...item });
    latestRecommendations.value = latestRecommendations.value.map((current) => current.id === item.id ? { ...item } : current);
    logEvent("outfit_save_toggled", { saved: item.saved });
    return true;
  }

  function setFeedback(item: Outfit, feedback: "liked" | "disliked" | "none", reasons: DislikeReason[] = []): void {
    item.feedback = feedback;
    item.dislikeReasons = feedback === "disliked" ? reasons : [];
    item.updatedAt = Date.now();
    merge({ ...item });
    latestRecommendations.value = latestRecommendations.value.map((current) => current.id === item.id ? { ...item } : current);
    logEvent("outfit_feedback", { feedback, reasonCount: reasons.length });
  }

  function markWorn(item: Outfit, when = Date.now()): void {
    item.wornAtList = [...item.wornAtList, when];
    item.updatedAt = when;
    merge({ ...item });
    logEvent("outfit_marked_worn", { itemCount: item.itemIds.length });
  }

  function removeSaved(id: string): void {
    const item = outfits.value.find((current) => current.id === id);
    if (!item) return;
    item.saved = false;
    item.updatedAt = Date.now();
    persist();
  }

  function remove(id: string): void {
    const current = outfits.value.find((item) => item.id === id);
    if (!current) return;
    outfits.value = outfits.value.filter((item) => item.id !== id);
    latestRecommendations.value = latestRecommendations.value.filter((item) => item.id !== id);
    persist();
    logEvent("outfit_removed", { itemCount: current.itemIds.length });
  }

  function replaceAll(items: Outfit[]): void { outfits.value = items; persist(); }
  return { outfits, latestRecommendations, saved, hydrate, setRecommendations, toggleSave, setFeedback, markWorn, removeSaved, remove, replaceAll };
});
