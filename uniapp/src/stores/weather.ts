import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { WeatherSnapshot } from "@/domain/types";
import { repositories } from "@/infrastructure/repositories";
import { exampleWeather, fetchWeather, getCurrentCoordinates, openLocationSettings, searchCity, type CityCandidate } from "@/infrastructure/weather";
import { LocationFailure, type LocationFailureCode } from "@/domain/ports";
import { logEvent } from "@/infrastructure/events";

export const useWeatherStore = defineStore("weather", () => {
  const weather = ref<WeatherSnapshot | null>(repositories.getWeather());
  const loading = ref(false);
  const error = ref("");
  const locationFailure = ref<LocationFailureCode | null>(null);
  const cityResults = ref<CityCandidate[]>([]);
  const searchedCity = ref(false);
  const age = computed(() => weather.value ? Date.now() - weather.value.observedAt : Number.POSITIVE_INFINITY);
  const stale = computed(() => age.value > 2 * 60 * 60 * 1000);
  const fresh = computed(() => age.value < 30 * 60 * 1000);

  async function useCurrentLocation(): Promise<void> {
    loading.value = true; error.value = ""; locationFailure.value = null;
    try {
      weather.value = await fetchWeather(await getCurrentCoordinates());
      repositories.saveWeather(weather.value);
      logEvent("weather_loaded", { method: "location" });
    } catch (failure) {
      locationFailure.value = failure instanceof LocationFailure ? failure.code : "unknown";
      error.value = locationFailure.value === "denied" ? "定位权限未开启" : locationFailure.value === "disabled" ? "系统定位服务未开启" : locationFailure.value === "timeout" ? "定位超时，请重试" : "无法获取当前位置";
      if (weather.value) weather.value = { ...weather.value, source: "cache" };
      logEvent("weather_failed", { method: "location" });
    } finally { loading.value = false; }
  }

  async function openSettings(): Promise<void> {
    try { await openLocationSettings(); }
    catch { uni.showToast({ title: "请在系统设置中开启定位权限", icon: "none" }); }
  }

  async function findCities(keyword: string): Promise<void> {
    if (!keyword.trim()) { clearCitySearch(); return; }
    loading.value = true; error.value = "";
    try { cityResults.value = await searchCity(keyword.trim()); searchedCity.value = true; }
    catch { error.value = "城市搜索失败，请检查网络后重试"; }
    finally { loading.value = false; }
  }

  async function selectCity(city: CityCandidate): Promise<void> {
    loading.value = true; error.value = "";
    try { weather.value = await fetchWeather(city); repositories.saveWeather(weather.value); clearCitySearch(); logEvent("weather_loaded", { method: "city" }); }
    catch { error.value = "天气获取失败，请稍后重试"; if (weather.value) weather.value = { ...weather.value, source: "cache" }; logEvent("weather_failed", { method: "city" }); }
    finally { loading.value = false; }
  }

  function useExample(): void { weather.value = { ...exampleWeather, observedAt: Date.now() }; repositories.saveWeather(weather.value); logEvent("weather_loaded", { method: "example" }); }
  function clearCitySearch(): void { cityResults.value = []; searchedCity.value = false; }
  return { weather, loading, error, locationFailure, cityResults, searchedCity, stale, fresh, useCurrentLocation, openSettings, findCities, selectCity, clearCitySearch, useExample };
});
