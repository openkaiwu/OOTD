import type { WeatherSnapshot } from "@/domain/types";
import { LocationFailure, type Coordinates, type LocationFailureCode, type LocationPort, type WeatherPort } from "@/domain/ports";
import { appLanguage, type AppLanguage } from "@/i18n";

const WMO: Record<number, string> = { 0: "晴朗", 1: "多云", 2: "多云", 3: "阴天", 45: "雾", 51: "毛毛雨", 61: "小雨", 63: "中雨", 65: "大雨", 71: "小雪", 73: "中雪", 75: "大雪", 80: "阵雨", 81: "雷阵雨", 82: "暴雨", 95: "雷雨" };

function request<T>(url: string, data: Record<string, unknown>, timeout = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({ url, data, timeout, success: (response) => {
      if (response.statusCode >= 200 && response.statusCode < 300) resolve(response.data as T);
      else reject(new Error(`HTTP ${response.statusCode}`));
    }, fail: reject });
  });
}

export function getCurrentCoordinates(): Promise<Coordinates> {
  // 本地 Android 预览壳可直接读取系统最近位置，避免部分 WebView 不回调浏览器定位。
  // #ifdef H5
  const previewBridge = (globalThis as unknown as { OOTDNative?: { getLastKnownLocation?(language?: string): string } }).OOTDNative;
  const previewValue = previewBridge?.getLastKnownLocation?.(appLanguage.value) || "";
  const [latitudeText, longitudeText, previewCity] = previewValue.includes("\u001f") ? previewValue.split("\u001f") : previewValue.split(",");
  const previewLatitude = Number(latitudeText);
  const previewLongitude = Number(longitudeText);
  if (Number.isFinite(previewLatitude) && Number.isFinite(previewLongitude)) {
    return Promise.resolve({ latitude: previewLatitude, longitude: previewLongitude, city: previewCity || "当前位置" });
  }
  // #endif
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callback: () => void) => { if (!settled) { settled = true; callback(); } };
    const timer = setTimeout(() => finish(() => reject(new LocationFailure("timeout", "定位超时"))), 10000);
    uni.getLocation({
      type: "wgs84",
      isHighAccuracy: true,
      highAccuracyExpireTime: 5000,
      success: (location) => finish(() => { clearTimeout(timer); resolve({ latitude: location.latitude, longitude: location.longitude, city: "当前位置" }); }),
      fail: (error) => finish(() => { clearTimeout(timer); reject(toLocationFailure(error)); }),
    });
  });
}

export function toLocationFailure(error: unknown): LocationFailure {
  const detail = String((error as { errMsg?: string; message?: string })?.errMsg || (error as { message?: string })?.message || error || "").toLowerCase();
  let code: LocationFailureCode = "unknown";
  if (/denied|deny|auth|permission|authorize/.test(detail)) code = "denied";
  else if (/disabled|not enabled|service.*off|定位服务未开启|系统定位/.test(detail)) code = "disabled";
  else if (/timeout|timed out|超时/.test(detail)) code = "timeout";
  else if (/unavailable|fail to get|无法获取/.test(detail)) code = "unavailable";
  return new LocationFailure(code, detail || "定位失败");
}

export function openLocationSettings(): Promise<void> {
  // #ifdef APP-PLUS
  return new Promise((resolve, reject) => {
    try {
      const plusRuntime = plus as unknown as { android: { runtimeMainActivity(): { getPackageName(): string; startActivity(intent: unknown): void }; importClass(name: string): any } };
      const main = plusRuntime.android.runtimeMainActivity();
      const Intent = plusRuntime.android.importClass("android.content.Intent");
      const Settings = plusRuntime.android.importClass("android.provider.Settings");
      const Uri = plusRuntime.android.importClass("android.net.Uri");
      const intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
      intent.setData(Uri.parse(`package:${main.getPackageName()}`));
      main.startActivity(intent); resolve();
    } catch (error) { reject(error); }
  });
  // #endif
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => uni.openSetting({ success: () => resolve(), fail: reject }));
  // #endif
  // #ifdef H5
  const bridge = (globalThis as unknown as { OOTDNative?: { openAppSettings(): void } }).OOTDNative;
  bridge?.openAppSettings();
  if (bridge) return Promise.resolve();
  return Promise.reject(new Error("请在系统设置中开启定位权限"));
  // #endif
  // #ifndef APP-PLUS
  // #ifndef MP-WEIXIN
  // #ifndef H5
  return Promise.reject(new Error("当前平台不支持打开设置"));
  // #endif
  // #endif
  // #endif
}

function geocodingLanguage(language: AppLanguage): string { return language === "zh-CN" ? "zh" : language; }

type GeocodingResult = {
  id?: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
  country_code?: string;
  feature_code?: string;
  population?: number;
};

export type CityCandidate = Coordinates & { detail: string };

const CHINA_QUERY_ALIASES = new Set([
  "china", "beijing", "shanghai", "tianjin", "chongqing", "hebei", "henan", "liaoning", "zhejiang", "jiangsu", "sichuan", "guangdong", "shandong", "hunan", "hubei", "fujian", "anhui", "jiangxi", "shanxi", "shaanxi", "yunnan", "guizhou", "guangxi", "hainan", "heilongjiang", "jilin", "gansu", "qinghai", "ningxia", "xinjiang", "xizang", "tibet", "inner mongolia"
]);

function normalizedPlace(value: string): string {
  return value.toLocaleLowerCase().replace(/[\s·,，.。'"-]/g, "").replace(/[省市自治区特别行政区]/g, "");
}

function isChinaQuery(keyword: string): boolean {
  return /[\u3400-\u9fff]/.test(keyword) || CHINA_QUERY_ALIASES.has(normalizedPlace(keyword));
}

function cityRank(item: GeocodingResult, needle: string, chinaOnly: boolean): number {
  const name = normalizedPlace(item.name);
  const exact = name === needle ? 1_000_000_000 : name.startsWith(needle) ? 100_000_000 : name.includes(needle) ? 10_000_000 : 0;
  const country = chinaOnly && String(item.country_code || "").toUpperCase() === "CN" ? 1_000_000 : 0;
  const feature = String(item.feature_code || "").toUpperCase();
  // 首府/地级市优先，其次是省级行政区，再是普通聚落；避免同名乡镇盖过城市或省份。
  const settlement = /^PPLA?C?$|^PPLG?$/.test(feature) ? 350_000 : /^ADM1$/.test(feature) ? 330_000 : /^PPL/.test(feature) ? 120_000 : 30_000;
  return exact + country + settlement + Math.min(item.population || 0, 9_999_999);
}

function displayPlace(item: GeocodingResult): CityCandidate {
  const suffix = [item.admin1, item.country_code === "CN" ? "" : item.country].filter(Boolean).join(" · ");
  return { latitude: item.latitude, longitude: item.longitude, city: item.name, detail: suffix || item.country || "" };
}

export async function searchCity(keyword: string): Promise<CityCandidate[]> {
  const chinaOnly = isChinaQuery(keyword);
  const clean = keyword.trim();
  const normalized = normalizedPlace(clean);
  const parameters: Record<string, unknown> = { name: clean, count: 30, language: geocodingLanguage(appLanguage.value), format: "json" };
  if (chinaOnly) parameters.countryCode = "CN";
  const response = await request<{ results?: GeocodingResult[] }>(
    "https://geocoding-api.open-meteo.com/v1/search",
    parameters,
  );
  const seen = new Set<string>();
  return (response.results || [])
    .filter((item) => !chinaOnly || String(item.country_code || "").toUpperCase() === "CN")
    .filter((item) => /^(PPL|ADM1)/.test(item.feature_code || "PPL"))
    .sort((left, right) => cityRank(right, normalized, chinaOnly) - cityRank(left, normalized, chinaOnly))
    .filter((item) => {
      const key = `${item.name}|${item.admin1 || ""}|${item.country_code || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6)
    .map(displayPlace);
}

export async function fetchWeather(coords: Coordinates): Promise<WeatherSnapshot> {
  const response = await request<{ timezone?: string; current: { temperature_2m: number; apparent_temperature: number; relative_humidity_2m: number; weather_code: number; wind_speed_10m: number }; daily?: { temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_probability_max?: number[] } }>(
    "https://api.open-meteo.com/v1/forecast",
    { latitude: coords.latitude, longitude: coords.longitude, current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m", daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max", timezone: "auto", forecast_days: 1 },
  );
  const current = response.current;
  return {
    city: coords.city,
    latitude: coords.latitude,
    longitude: coords.longitude,
    temp: Math.round(current.temperature_2m),
    condition: WMO[current.weather_code] || "多云",
    code: current.weather_code,
    wind: Math.round(current.wind_speed_10m),
    humidity: current.relative_humidity_2m,
    feelsLike: Math.round(current.apparent_temperature),
    tempMin: response.daily?.temperature_2m_min?.[0] !== undefined ? Math.round(response.daily.temperature_2m_min[0]) : undefined,
    tempMax: response.daily?.temperature_2m_max?.[0] !== undefined ? Math.round(response.daily.temperature_2m_max[0]) : undefined,
    precipitationProbability: response.daily?.precipitation_probability_max?.[0],
    timezone: response.timezone,
    observedAt: Date.now(),
    source: "live",
  };
}

export const exampleWeather: WeatherSnapshot = {
  city: "示例天气",
  temp: 24,
  condition: "晴朗",
  code: 0,
  wind: 8,
  humidity: 52,
  observedAt: Date.now(),
  source: "example",
};

export const locationPort: LocationPort = { current: getCurrentCoordinates, openSettings: openLocationSettings };
export const weatherPort: WeatherPort = { searchCity, fetch: fetchWeather };
