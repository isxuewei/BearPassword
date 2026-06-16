import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { getCurrentUserApi, getVaultCryptoApi } from '@/api'
import { useAutoLockStore } from '@/stores/autoLock'
import type { VaultUnlockContext } from '@/utils/contentCrypto'
import {
  computeSecretKeyFingerprint,
  deriveVaultUnlockKey,
  generateAccountSecretKey,
  generateVaultSalt
} from '@/utils/vaultCrypto/vaultKeyDerivation'
import type { SecurityKeyReencryptProgress } from '@/utils/securityKeyReencrypt'
import { loadPersistedVaultPassword } from '@/utils/vaultPasswordStorage'
import {
  clearPersistedSecurityKey,
  loadPersistedSecurityKey,
  migrateLegacySecurityKeyIfNeeded,
  persistSecurityKey
} from '@/utils/securityKeyStorage'

const defaultMigrationProgress = (): SecurityKeyReencryptProgress => ({
  current: 0,
  total: 0,
  message: ''
})

/**
 * 保险库加密状态：账户密钥（钥匙串）+ VUK（内存，由主密码派生）
 */
export const useSecurityStore = defineStore('security', () => {
  const securityKey = ref<string | null>(null)
  const vuk = ref<Uint8Array | null>(null)
  const vaultSalt = ref<string | null>(null)
  const secretKeyFingerprint = ref<string | null>(null)
  const initialized = ref(false)
  const isMigrating = ref(false)
  const migrationProgress = ref<SecurityKeyReencryptProgress>(defaultMigrationProgress())

  const hasSecurityKey = computed(() => !!securityKey.value?.trim())
  const hasVaultAccess = computed(() => !!vuk.value)

  function readVaultCryptoField(
    meta: Record<string, unknown>,
    camelKey: string,
    snakeKey: string
  ): string | null {
    const value = meta[camelKey] ?? meta[snakeKey]
    if (value == null) return null
    const normalized = String(value).trim()
    return normalized || null
  }

  function syncVaultCryptoMeta(meta: {
    vaultSalt?: string | null
    secretKeyFingerprint?: string | null
    vault_salt?: string | null
    secret_key_fingerprint?: string | null
  }): void {
    const record = meta as Record<string, unknown>
    const nextVaultSalt = readVaultCryptoField(record, 'vaultSalt', 'vault_salt')
    const nextFingerprint = readVaultCryptoField(
      record,
      'secretKeyFingerprint',
      'secret_key_fingerprint'
    )
    if (nextVaultSalt) {
      vaultSalt.value = nextVaultSalt
    }
    if (nextFingerprint) {
      secretKeyFingerprint.value = nextFingerprint
    }
  }

  async function refreshVaultCryptoMeta(): Promise<void> {
    const profile = await getCurrentUserApi()
    syncVaultCryptoMeta(profile)

    if (!vaultSalt.value) {
      const crypto = await getVaultCryptoApi()
      syncVaultCryptoMeta(crypto)
    }
  }

  async function ensureVaultCryptoMeta(): Promise<void> {
    if (vaultSalt.value) return
    await refreshVaultCryptoMeta()
    if (!vaultSalt.value) {
      throw new Error('服务端缺少保险库加密配置')
    }
  }

  function getUnlockContext(): VaultUnlockContext | null {
    if (!vuk.value) return null
    return { vuk: vuk.value }
  }

  async function init(): Promise<void> {
    if (initialized.value) return

    const persistedKey = await loadPersistedSecurityKey()
    if (persistedKey) {
      await migrateLegacySecurityKeyIfNeeded(persistedKey)
      if (!useAutoLockStore().isLocked) {
        securityKey.value = persistedKey
      }
    }

    initialized.value = true
  }

  async function setSecurityKey(key: string | null): Promise<void> {
    const normalized = key?.trim() ?? ''
    if (normalized) {
      const result = await persistSecurityKey(normalized)
      if (!result.ok) {
        throw new Error(result.error ?? '账户密钥保存失败')
      }
      securityKey.value = normalized
      return
    }

    securityKey.value = null
    vuk.value = null
    await clearPersistedSecurityKey()
  }

  function unloadFromMemory(): void {
    securityKey.value = null
    vuk.value = null
  }

  async function reloadFromStorage(): Promise<void> {
    const key = await loadPersistedSecurityKey()
    securityKey.value = key?.trim() || null
    vuk.value = null
  }

  async function unlockWithMasterPassword(masterPassword: string): Promise<void> {
    const key = await loadPersistedSecurityKey()
    if (!key?.trim()) {
      throw new Error('本机未找到账户密钥，请使用 Emergency Kit 恢复')
    }

    await ensureVaultCryptoMeta()

    securityKey.value = key.trim()
    vuk.value = await deriveVaultUnlockKey(masterPassword, key, vaultSalt.value!)
  }

  async function deriveVukForAccountKey(accountSecretKey: string): Promise<Uint8Array> {
    const masterPassword = await loadPersistedVaultPassword()
    if (!masterPassword) {
      throw new Error('需要主密码才能处理账户密钥，请先在锁屏界面解锁保险库')
    }
    await ensureVaultCryptoMeta()
    return deriveVaultUnlockKey(masterPassword, accountSecretKey, vaultSalt.value!)
  }

  async function setupNewVaultCrypto(
    masterPassword: string,
    accountSecretKey: string
  ): Promise<{ vaultSalt: string; secretKeyFingerprint: string }> {
    const salt = generateVaultSalt()
    const fingerprint = await computeSecretKeyFingerprint(accountSecretKey)
    await setSecurityKey(accountSecretKey)
    syncVaultCryptoMeta({
      vaultSalt: salt,
      secretKeyFingerprint: fingerprint
    })
    await unlockWithMasterPassword(masterPassword)
    return { vaultSalt: salt, secretKeyFingerprint: fingerprint }
  }

  async function deriveVukForMasterPassword(masterPassword: string): Promise<Uint8Array> {
    const key = await loadPersistedSecurityKey()
    if (!key?.trim()) {
      throw new Error('本机未找到账户密钥，请使用 Emergency Kit 恢复')
    }
    await ensureVaultCryptoMeta()
    return deriveVaultUnlockKey(masterPassword, key, vaultSalt.value!)
  }

  function applyVaultUnlock(nextVuk: Uint8Array): void {
    vuk.value = nextVuk
  }

  async function onLoginSuccess(masterPassword?: string): Promise<void> {
    await refreshVaultCryptoMeta()
    await reloadFromStorage()
    if (!securityKey.value) return
    if (masterPassword) {
      await unlockWithMasterPassword(masterPassword)
    }
  }

  function createRandomSecurityKey(): string {
    return generateAccountSecretKey()
  }

  function beginMigration(message = '正在处理…'): void {
    isMigrating.value = true
    migrationProgress.value = { current: 0, total: 0, message }
  }

  function updateMigrationProgress(progress: SecurityKeyReencryptProgress): void {
    migrationProgress.value = progress
  }

  function endMigration(): void {
    isMigrating.value = false
    migrationProgress.value = defaultMigrationProgress()
  }

  return {
    securityKey,
    vuk,
    vaultSalt,
    secretKeyFingerprint,
    initialized,
    hasSecurityKey,
    hasVaultAccess,
    isMigrating,
    migrationProgress,
    init,
    setSecurityKey,
    unloadFromMemory,
    reloadFromStorage,
    deriveVukForMasterPassword,
    applyVaultUnlock,
    unlockWithMasterPassword,
    deriveVukForAccountKey,
    setupNewVaultCrypto,
    onLoginSuccess,
    refreshVaultCryptoMeta,
    ensureVaultCryptoMeta,
    syncVaultCryptoMeta,
    getUnlockContext,
    createRandomSecurityKey,
    beginMigration,
    updateMigrationProgress,
    endMigration
  }
})
