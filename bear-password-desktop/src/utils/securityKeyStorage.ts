import { storage } from '@/utils/storage'

/** 旧版 localStorage 中的密钥键名（迁移后删除） */
export const LEGACY_SECURITY_KEY_STORAGE_KEY = 'security_key'

export interface SecurityKeyPersistResult {
  ok: boolean
  error?: string
  usedLegacyFallback?: boolean
}

function canUseSecureStorageApi(): boolean {
  return typeof window !== 'undefined' && !!window.secureStorageApi
}

export async function loadPersistedSecurityKey(): Promise<string | null> {
  if (canUseSecureStorageApi()) {
    const key = await window.secureStorageApi!.get()
    if (key?.trim()) {
      return key.trim()
    }
  }

  const legacy = storage.get<string>(LEGACY_SECURITY_KEY_STORAGE_KEY)
  return legacy?.trim() || null
}

export async function migrateLegacySecurityKeyIfNeeded(key: string): Promise<void> {
  const legacy = storage.get<string>(LEGACY_SECURITY_KEY_STORAGE_KEY)
  if (!legacy?.trim()) return
  if (!canUseSecureStorageApi()) return

  const result = await window.secureStorageApi!.set(key)
  if (result.ok) {
    storage.remove(LEGACY_SECURITY_KEY_STORAGE_KEY)
  }
}

export async function persistSecurityKey(key: string): Promise<SecurityKeyPersistResult> {
  const normalized = key.trim()
  if (!normalized) {
    return { ok: false, error: '安全密钥不能为空' }
  }

  if (canUseSecureStorageApi()) {
    const result = await window.secureStorageApi!.set(normalized)
    if (!result.ok) {
      return { ok: false, error: result.error ?? '安全密钥保存失败' }
    }
    storage.remove(LEGACY_SECURITY_KEY_STORAGE_KEY)
    return { ok: true }
  }

  storage.set(LEGACY_SECURITY_KEY_STORAGE_KEY, normalized)
  return { ok: true, usedLegacyFallback: true }
}

export async function clearPersistedSecurityKey(): Promise<void> {
  if (canUseSecureStorageApi()) {
    await window.secureStorageApi!.remove()
  }
  storage.remove(LEGACY_SECURITY_KEY_STORAGE_KEY)
}

export async function isSecureSecurityKeyStorageAvailable(): Promise<boolean> {
  if (!canUseSecureStorageApi()) return false
  return window.secureStorageApi!.isAvailable()
}
