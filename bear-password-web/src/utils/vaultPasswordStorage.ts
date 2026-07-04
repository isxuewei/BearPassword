import {
  clearWebVaultPassword,
  isWebSecureStorageAvailable,
  loadWebVaultPassword,
  persistWebVaultPassword
} from '@/platform/webSecureStorage'
import { storage } from '@/utils/storage'

const REMEMBER_MASTER_PASSWORD_KEY = 'remember_master_password'

export interface VaultPasswordPersistResult {
  ok: boolean
  error?: string
}

export function isRememberMasterPasswordEnabled(): boolean {
  return storage.get<boolean>(REMEMBER_MASTER_PASSWORD_KEY) === true
}

export function setRememberMasterPasswordEnabled(enabled: boolean): void {
  storage.set(REMEMBER_MASTER_PASSWORD_KEY, enabled)
  if (!enabled) {
    void clearWebVaultPassword()
  }
}

export async function loadPersistedVaultPassword(): Promise<string | null> {
  if (!isRememberMasterPasswordEnabled()) return null
  return loadWebVaultPassword()
}

export async function persistVaultPassword(password: string): Promise<VaultPasswordPersistResult> {
  if (!password) {
    return { ok: false, error: '密码不能为空' }
  }
  if (!isRememberMasterPasswordEnabled()) {
    return { ok: true }
  }
  return persistWebVaultPassword(password)
}

export async function clearPersistedVaultPassword(): Promise<void> {
  await clearWebVaultPassword()
}

export async function isSecureVaultPasswordStorageAvailable(): Promise<boolean> {
  return isWebSecureStorageAvailable()
}
