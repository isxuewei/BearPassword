/**
 * 本地存储工具
 * 封装 localStorage，统一 key 前缀，便于后续迁移到 Electron safeStorage
 */

const PREFIX = 'bear_password_'

export const storage = {
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw === null) return defaultValue ?? null
      return JSON.parse(raw) as T
    } catch {
      return defaultValue ?? null
    }
  },

  set(key: string, value: unknown): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },

  clear(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  }
}
