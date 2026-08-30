export interface KeyValueStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export class UniKeyValueStorage implements KeyValueStorage {
  get<T>(key: string, fallback: T): T {
    try {
      const value = uni.getStorageSync(key);
      return value === "" || value === undefined || value === null ? fallback : (value as T);
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    const backupKey = `${key}:backup`;
    const current = this.get<T | null>(key, null);
    if (current !== null) uni.setStorageSync(backupKey, current);
    uni.setStorageSync(key, value);
    const verify = uni.getStorageSync(key);
    if (verify === "" || verify === undefined) {
      if (current !== null) uni.setStorageSync(key, current);
      throw new Error(`Storage verification failed: ${key}`);
    }
  }

  remove(key: string): void {
    uni.removeStorageSync(key);
    uni.removeStorageSync(`${key}:backup`);
  }
}

export class MemoryKeyValueStorage implements KeyValueStorage {
  private values = new Map<string, unknown>();
  get<T>(key: string, fallback: T): T { return (this.values.has(key) ? this.values.get(key) : fallback) as T; }
  set<T>(key: string, value: T): void { this.values.set(key, structuredClone(value)); }
  remove(key: string): void { this.values.delete(key); }
}
