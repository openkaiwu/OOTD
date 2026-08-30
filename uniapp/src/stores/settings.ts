import { ref } from "vue";
import { defineStore } from "pinia";
import type { AppMeta, DislikeReason, FeedbackCategory, Garment, Outfit, ThemeId, UserPreference, UserProfile } from "@/domain/types";
import { applyFeedback, decayFeedback } from "@/domain/feedback";
import { defaultAppMeta, defaultPreference, repositories } from "@/infrastructure/repositories";
import { getLlmSettings, saveLlmSettings as persistLlmSettings, type LlmSettings } from "@/infrastructure/llm";

export const useSettingsStore = defineStore("settings", () => {
  const profile = ref<UserProfile>(repositories.getProfile());
  const preferences = ref<UserPreference>({ ...defaultPreference });
  const appMeta = ref<AppMeta>({ ...defaultAppMeta, localFeedback: [] });
  const llm = ref<LlmSettings>(getLlmSettings());

  function hydrate(): void {
    profile.value = repositories.getProfile();
    preferences.value = repositories.getPreferences();
    appMeta.value = repositories.getAppMeta();
    llm.value = getLlmSettings();
    // 反馈权重按 30 天半衰期衰减，近期喜好影响更大
    const decayed = decayFeedback(preferences.value, Date.now());
    if (decayed !== preferences.value) {
      preferences.value = decayed;
      repositories.savePreferences(decayed);
    }
  }
  function saveProfile(value: UserProfile): void { profile.value = value; repositories.saveProfile(value); }
  function savePreferences(value: UserPreference): void { preferences.value = value; repositories.savePreferences(value); }
  function saveAppMeta(value: AppMeta): void { appMeta.value = value; repositories.saveAppMeta(value); }
  function setTheme(themeId: ThemeId): void { saveAppMeta({ ...appMeta.value, themeId }); }
  function markTutorialSeen(): void { saveAppMeta({ ...appMeta.value, tutorialSeen: true }); }
  function addLocalFeedback(category: FeedbackCategory, content: string): void {
    const item = { id: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, category, content, createdAt: Date.now(), status: "local" as const };
    saveAppMeta({ ...appMeta.value, localFeedback: [item, ...appMeta.value.localFeedback].slice(0, 30) });
  }
  function removeLocalFeedback(id: string): void { saveAppMeta({ ...appMeta.value, localFeedback: appMeta.value.localFeedback.filter((item) => item.id !== id) }); }
  function penalizeItem(id: string, amount = 1): void {
    preferences.value.negativeWeights[id] = Math.min(8, (preferences.value.negativeWeights[id] || 0) + amount);
    repositories.savePreferences(preferences.value);
  }
  function saveLlmSettings(value: LlmSettings): void {
    llm.value = { ...value };
    persistLlmSettings(llm.value);
  }
  // 反馈闭环入口：点赞正向强化，点踩按原因降权（单品/风格/颜色）
  function applyOutfitFeedback(item: Outfit, garments: Garment[], liked: boolean, reason?: DislikeReason): void {
    const involved = item.itemIds
      .map((id) => garments.find((garment) => garment.id === id))
      .filter((garment): garment is Garment => Boolean(garment));
    if (!involved.length) return;
    preferences.value = applyFeedback(preferences.value, involved, { liked, reason }, Date.now());
    repositories.savePreferences(preferences.value);
  }

  return {
    profile, preferences, appMeta, llm,
    hydrate, saveProfile, savePreferences, saveAppMeta, setTheme, markTutorialSeen,
    addLocalFeedback, removeLocalFeedback, penalizeItem, saveLlmSettings, applyOutfitFeedback,
  };
});
