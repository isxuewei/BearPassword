import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { generateSecurityKey } from '@/utils/contentCrypto'
import type { SecurityKeyMigrationProgress } from '@/utils/securityKeyMigration'
import { storage } from '@/utils/storage'

const STORAGE_KEY = 'security_key'

const defaultMigrationProgress = (): SecurityKeyMigrationProgress => ({
  current: 0,
  total: 0,
  message: ''
})

/**
 * 客户端安全密钥（仅本地存储，用于 content 加解密）
 */
export const useSecurityStore = defineStore('security', () => {
  const securityKey = ref<string | null>(storage.get<string>(STORAGE_KEY))
  const isMigrating = ref(false)
  const migrationProgress = ref<SecurityKeyMigrationProgress>(defaultMigrationProgress())

  const hasSecurityKey = computed(() => !!securityKey.value?.trim())

  function setSecurityKey(key: string | null): void {
    const normalized = key?.trim() ?? ''
    if (normalized) {
      securityKey.value = normalized
      storage.set(STORAGE_KEY, normalized)
      return
    }
    securityKey.value = null
    storage.remove(STORAGE_KEY)
  }

  function createRandomSecurityKey(): string {
    return generateSecurityKey()
  }

  function beginMigration(message = '正在处理…'): void {
    isMigrating.value = true
    migrationProgress.value = { current: 0, total: 0, message }
  }

  function updateMigrationProgress(progress: SecurityKeyMigrationProgress): void {
    migrationProgress.value = progress
  }

  function endMigration(): void {
    isMigrating.value = false
    migrationProgress.value = defaultMigrationProgress()
  }

  return {
    securityKey,
    hasSecurityKey,
    isMigrating,
    migrationProgress,
    setSecurityKey,
    createRandomSecurityKey,
    beginMigration,
    updateMigrationProgress,
    endMigration
  }
})
