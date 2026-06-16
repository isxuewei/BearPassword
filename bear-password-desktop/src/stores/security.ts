import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { generateSecurityKey } from '@/utils/contentCrypto'
import type { SecurityKeyReencryptProgress } from '@/utils/securityKeyReencrypt'
import {
  clearPersistedSecurityKey,
  loadPersistedSecurityKey,
  migrateLegacySecurityKeyIfNeeded,
  persistSecurityKey
} from '@/utils/securityKeyStorage'
import { useAutoLockStore } from '@/stores/autoLock'

const defaultMigrationProgress = (): SecurityKeyReencryptProgress => ({
  current: 0,
  total: 0,
  message: ''
})

/**
 * 客户端安全密钥（系统安全存储，用于 content 加解密）
 */
export const useSecurityStore = defineStore('security', () => {
  const securityKey = ref<string | null>(null)
  const initialized = ref(false)
  const isMigrating = ref(false)
  const migrationProgress = ref<SecurityKeyReencryptProgress>(defaultMigrationProgress())

  const hasSecurityKey = computed(() => !!securityKey.value?.trim())

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
        throw new Error(result.error ?? '安全密钥保存失败')
      }
      securityKey.value = normalized
      return
    }

    securityKey.value = null
    await clearPersistedSecurityKey()
  }

  /** 退出登录时仅从内存卸载密钥，保留系统安全存储中的副本 */
  function unloadFromMemory(): void {
    securityKey.value = null
  }

  /** 登录成功后从系统安全存储重新加载密钥到内存 */
  async function reloadFromStorage(): Promise<void> {
    const key = await loadPersistedSecurityKey()
    securityKey.value = key?.trim() || null
  }

  function createRandomSecurityKey(): string {
    return generateSecurityKey()
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
    initialized,
    hasSecurityKey,
    isMigrating,
    migrationProgress,
    init,
    setSecurityKey,
    unloadFromMemory,
    reloadFromStorage,
    createRandomSecurityKey,
    beginMigration,
    updateMigrationProgress,
    endMigration
  }
})
