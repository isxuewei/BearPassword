import {
  clearWebSecurityKey,
  isWebSecureStorageAvailable,
  loadWebSecurityKey,
  persistWebSecurityKey
} from '@/platform/webSecureStorage'

export interface SecurityKeyPersistResult {
  ok: boolean
  error?: string
}

export async function loadPersistedSecurityKey(): Promise<string | null> {
  return loadWebSecurityKey()
}

export async function migrateLegacySecurityKeyIfNeeded(_key: string): Promise<void> {
  // Web 端不使用 localStorage 明文存储，无需迁移
}

export async function persistSecurityKey(key: string): Promise<SecurityKeyPersistResult> {
  const normalized = key.trim()
  if (!normalized) {
    return { ok: false, error: '安全密钥不能为空' }
  }
  return persistWebSecurityKey(normalized)
}

export async function clearPersistedSecurityKey(): Promise<void> {
  await clearWebSecurityKey()
}

export async function isSecureSecurityKeyStorageAvailable(): Promise<boolean> {
  return isWebSecureStorageAvailable()
}
