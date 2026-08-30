import type { AppMeta, Garment, Outfit, ProcessingDraft, UserPreference, UserProfile, WeatherSnapshot } from "@/domain/types";
import type { AppMetaRepository, DraftRepository, GarmentRepository, OutfitRepository, PreferenceRepository } from "@/domain/ports";
import { STORAGE_KEYS } from "@/domain/constants";
import { UniKeyValueStorage, type KeyValueStorage } from "./storage";

const defaultProfile: UserProfile = {
  nickname: "穿搭探索者",
  avatarPath: "/static/avatar.png",
  description: "让每一件衣服都被好好穿着",
  schemaVersion: 2,
};

export const defaultPreference: UserPreference = {
  styleIds: ["minimal", "elegant"],
  sceneIds: ["commute", "weekend"],
  preferredColorIds: [],
  avoidedColorIds: [],
  rotateUnderused: true,
  allowIncomplete: true,
  negativeWeights: {},
  schemaVersion: 1,
};

export const defaultAppMeta: AppMeta = {
  themeId: "dream",
  tutorialSeen: false,
  localFeedback: [],
  schemaVersion: 1,
};

export class AppRepositories implements GarmentRepository, OutfitRepository, PreferenceRepository, DraftRepository, AppMetaRepository {
  constructor(private readonly storage: KeyValueStorage = new UniKeyValueStorage()) {}

  listGarments(): Garment[] { return this.storage.get(STORAGE_KEYS.garments, []); }
  saveGarments(items: Garment[]): void { this.storage.set(STORAGE_KEYS.garments, items); }
  listOutfits(): Outfit[] { return this.storage.get(STORAGE_KEYS.outfits, []); }
  saveOutfits(items: Outfit[]): void { this.storage.set(STORAGE_KEYS.outfits, items); }
  getProfile(): UserProfile { return this.storage.get(STORAGE_KEYS.profile, defaultProfile); }
  saveProfile(profile: UserProfile): void { this.storage.set(STORAGE_KEYS.profile, profile); }
  getPreferences(): UserPreference { return this.storage.get(STORAGE_KEYS.preferences, defaultPreference); }
  savePreferences(value: UserPreference): void { this.storage.set(STORAGE_KEYS.preferences, value); }
  getWeather(): WeatherSnapshot | null { return this.storage.get(STORAGE_KEYS.weather, null); }
  saveWeather(value: WeatherSnapshot): void { this.storage.set(STORAGE_KEYS.weather, value); }
  getAppMeta(): AppMeta {
    const value = this.storage.get<Partial<AppMeta>>(STORAGE_KEYS.meta, defaultAppMeta);
    return {
      themeId: ["dream", "ins", "forest"].includes(value.themeId || "") ? value.themeId as AppMeta["themeId"] : "dream",
      tutorialSeen: Boolean(value.tutorialSeen),
      localFeedback: Array.isArray(value.localFeedback) ? value.localFeedback : [],
      schemaVersion: 1,
    };
  }
  saveAppMeta(value: AppMeta): void { this.storage.set(STORAGE_KEYS.meta, value); }
  getDraft(): ProcessingDraft | null { return this.storage.get(STORAGE_KEYS.drafts, null); }
  saveDraft(value: ProcessingDraft): void { this.storage.set(STORAGE_KEYS.drafts, value); }
  clearDraft(): void { this.storage.remove(STORAGE_KEYS.drafts); }

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach((key) => this.storage.remove(key));
  }
}

export const repositories = new AppRepositories();
