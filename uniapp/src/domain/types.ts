export type CategoryId =
  | "top-short"
  | "top-long"
  | "outerwear"
  | "pants"
  | "skirt"
  | "dress"
  | "shoes"
  | "accessory";

export type SeasonId = "spring" | "summer" | "autumn" | "winter";
export type LayerPlan = "hot" | "warm" | "mild" | "cold";
export type Feedback = "none" | "liked" | "disliked";
export type DislikeReason = "color" | "style" | "weather" | "item";
export type GarmentAvailability = "active" | "archived" | "unavailable";
export type ThemeId = "dream" | "ins" | "forest";
export type FeedbackCategory = "功能建议" | "体验问题" | "定位天气" | "其他";

export interface LocalFeedback {
  id: string;
  category: FeedbackCategory;
  content: string;
  createdAt: number;
  status: "local";
}

export interface AppMeta {
  themeId: ThemeId;
  tutorialSeen: boolean;
  localFeedback: LocalFeedback[];
  schemaVersion: 1;
}

export interface Garment {
  id: string;
  name: string;
  imagePath: string;
  thumbnailPath: string;
  categoryId: CategoryId;
  colorHex: string;
  colorName: string;
  materialId?: string;
  seasonIds: SeasonId[];
  styleIds: string[];
  sceneIds: string[];
  tags: string[];
  favorite: boolean;
  availability: GarmentAvailability;
  wearCount: number;
  lastWornAt?: number;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
  schemaVersion: 2;
}

export interface WeatherSnapshot {
  city: string;
  latitude?: number;
  longitude?: number;
  temp: number;
  condition: string;
  code: number;
  wind: number;
  humidity: number;
  feelsLike?: number;
  tempMin?: number;
  tempMax?: number;
  precipitationProbability?: number;
  timezone?: string;
  observedAt: number;
  source: "live" | "cache" | "manual" | "example";
}

export interface RecommendationContext {
  source: "home" | "scene" | "weather" | "saved_retry";
  inspirationPresetId?: string;
  sceneId: string;
  weatherSnapshot?: WeatherSnapshot;
  seasonId?: SeasonId;
  preferredStyleIds: string[];
  preferredColorIds: string[];
  avoidedColorIds: string[];
  pinnedItemId?: string;
  excludedOutfitSignatures: string[];
  generatedAt: number;
}

export interface OutfitScoreDetail {
  weather: number;
  scene: number;
  color: number;
  preference: number;
  rotation: number;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  sceneId?: string;
  contextSnapshot: RecommendationContext;
  score: number;
  reason: string;
  scoreDetail?: OutfitScoreDetail;
  styleTags: string[];
  feedback: Feedback;
  dislikeReasons: DislikeReason[];
  saved: boolean;
  wornAtList: number[];
  createdAt: number;
  updatedAt: number;
  schemaVersion: 2;
}

export interface UserProfile {
  nickname: string;
  avatarPath: string;
  description: string;
  schemaVersion: 2;
}

export interface UserPreference {
  styleIds: string[];
  sceneIds: string[];
  preferredColorIds: string[];
  avoidedColorIds: string[];
  rotateUnderused: boolean;
  allowIncomplete: boolean;
  negativeWeights: Record<string, number>;
  styleWeights?: Record<string, number>;
  colorWeights?: Record<string, number>;
  positiveWeights?: Record<string, number>;
  lastFeedbackAt?: number;
  schemaVersion: 1;
}

export interface ProcessingDraftItem {
  id: string;
  sourcePath: string;
  persistedPath: string;
  thumbnailPath: string;
  status: "queued" | "compressing" | "persisting" | "recognizing" | "review" | "failed";
  progress: number;
  error?: string;
  suggestion?: Partial<Garment>;
  confirmed: boolean;
  /** 是否成功抠图 */
  matted?: boolean;
  /** 抠图后全图（透明底 PNG，可能为空字符串：未抠图或体积超预算） */
  mattePath?: string;
  /** 抠图后缩略图（透明底 PNG） */
  matteThumbnailPath?: string;
  /** 未抠图的全图（JPEG），确认页切换"原图"用 */
  originalPath?: string;
  /** 未抠图的缩略图（JPEG） */
  originalThumbnailPath?: string;
  /** 手动裁剪后的图（data URL），存在时优先用于入衣橱 */
  cropPath?: string;
  /** 手动裁剪后的缩略图（data URL） */
  cropThumbnailPath?: string;
}

export interface ProcessingDraft {
  id: string;
  entry: string;
  items: ProcessingDraftItem[];
  createdAt: number;
  updatedAt: number;
  schemaVersion: 1;
}

export interface BackupManifest {
  product: "ootd-uniapp";
  version: 1 | 2;
  exportedAt: number;
  garments: Garment[];
  outfits: Outfit[];
  profile: UserProfile;
  preferences: UserPreference;
  appMeta?: AppMeta;
  assets?: BackupAsset[];
}

export interface InspirationPreset {
  id: string;
  sceneId: string;
  name: string;
  icon: string;
  description: string;
  seasonIds: SeasonId[];
  styleIds: string[];
  colorIds: string[];
  group: "日常" | "职场" | "社交" | "旅行" | "运动" | "仪式";
}

export interface BackupAsset {
  garmentId: string;
  kind: "image" | "thumbnail";
  archivePath: string;
}

export interface BackupArchiveInfo {
  name: string;
  path: string;
  createdAt: number;
}

export interface BackupArchiveResult extends BackupArchiveInfo {
  garmentCount: number;
  imageCount: number;
}
