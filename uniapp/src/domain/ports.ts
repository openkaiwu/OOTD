import type {
  BackupManifest,
  BackupArchiveInfo,
  BackupArchiveResult,
  Garment,
  Outfit,
  ProcessingDraft,
  ProcessingDraftItem,
  UserPreference,
  UserProfile,
  WeatherSnapshot,
  AppMeta,
} from "./types";

export type MediaSource = "camera" | "album";
export interface Coordinates { latitude: number; longitude: number; city: string; }

export interface GarmentRepository {
  listGarments(): Garment[];
  saveGarments(items: Garment[]): void;
}

export interface OutfitRepository {
  listOutfits(): Outfit[];
  saveOutfits(items: Outfit[]): void;
}

export interface PreferenceRepository {
  getProfile(): UserProfile;
  saveProfile(profile: UserProfile): void;
  getPreferences(): UserPreference;
  savePreferences(value: UserPreference): void;
}

export interface AppMetaRepository {
  getAppMeta(): AppMeta;
  saveAppMeta(value: AppMeta): void;
}

export interface DraftRepository {
  getDraft(): ProcessingDraft | null;
  saveDraft(value: ProcessingDraft): void;
  clearDraft(): void;
}

export interface MediaPickerPort {
  choose(source: MediaSource, count: number): Promise<string[]>;
}

export interface FileStorePort {
  prepare(sourcePath: string): Promise<ProcessingDraftItem>;
  remove(path: string): Promise<void>;
}

export type LocationFailureCode = "denied" | "disabled" | "timeout" | "unavailable" | "unknown";
export class LocationFailure extends Error {
  constructor(public readonly code: LocationFailureCode, message: string) { super(message); }
}

export interface LocationPort {
  current(): Promise<Coordinates>;
  openSettings(): Promise<void>;
}

export interface WeatherPort {
  searchCity(keyword: string): Promise<Coordinates[]>;
  fetch(coords: Coordinates): Promise<WeatherSnapshot>;
}

export interface SharePort { share(outfit: Outfit, garments: Garment[]): Promise<void>; }

export interface BackupPort {
  create(): BackupManifest;
  exportMetadata(): Promise<number>;
  importMetadata(): Promise<BackupManifest>;
  supportsFullArchive(): boolean;
  exportArchive(): Promise<BackupArchiveResult>;
  listArchives(): Promise<BackupArchiveInfo[]>;
  importArchive(path: string): Promise<BackupManifest>;
}

export interface HapticsPort { tap(): void; }
export interface ClockPort { now(): number; }
export interface IdGeneratorPort { create(prefix: string): string; }
