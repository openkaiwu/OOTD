import { STORAGE_KEYS } from "@/domain/constants";

export interface LocalEvent {
  name: string;
  at: number;
  properties: Record<string, string | number | boolean>;
}

const MAX_EVENTS = 300;

export function logEvent(name: string, properties: LocalEvent["properties"] = {}): void {
  try {
    const current = (uni.getStorageSync(STORAGE_KEYS.events) || []) as LocalEvent[];
    uni.setStorageSync(STORAGE_KEYS.events, [...current, { name, at: Date.now(), properties }].slice(-MAX_EVENTS));
  } catch { /* Diagnostics must never block the user flow. */ }
}

export function listEvents(): LocalEvent[] {
  try { return (uni.getStorageSync(STORAGE_KEYS.events) || []) as LocalEvent[]; }
  catch { return []; }
}

export function clearEvents(): void {
  try { uni.removeStorageSync(STORAGE_KEYS.events); } catch { /* no-op */ }
}
