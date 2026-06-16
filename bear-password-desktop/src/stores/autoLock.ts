import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  AUTO_LOCK_OPTIONS,
  DEFAULT_AUTO_LOCK_MINUTES,
  type AutoLockMinutes
} from '@/types/autoLock'
import { useAuthStore } from '@/stores/auth'
import { useSecurityStore } from '@/stores/security'
import { useVaultStore } from '@/stores/vault'
import { storage } from '@/utils/storage'
import { clearSensitiveClipboardOnLock } from '@/utils/sensitiveClipboard'

const STORAGE_KEY = 'auto_lock_minutes'
const LOCK_STATE_KEY = 'app_locked'
const ALLOWED_MINUTES = AUTO_LOCK_OPTIONS.map((item) => item.value)
const CHECK_INTERVAL_MS = 1000

let checkInterval: ReturnType<typeof setInterval> | null = null
let lastActivityAt = Date.now()

function normalizeLockMinutes(value: unknown): AutoLockMinutes {
  const minutes = Number(value)
  return ALLOWED_MINUTES.includes(minutes as AutoLockMinutes)
    ? (minutes as AutoLockMinutes)
    : DEFAULT_AUTO_LOCK_MINUTES
}

function clearCheckInterval(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

function hideWindowAfterLock(): void {
  window.windowApi?.hide()
}

function isMigrationActive(): boolean {
  return useSecurityStore().isMigrating
}

/** 锁定时清除内存中的安全密钥与已解密的密码库缓存 */
function applySecureLockSideEffects(): void {
  useSecurityStore().unloadFromMemory()
  useVaultStore().reset()
  void clearSensitiveClipboardOnLock()
}

/**
 * 自动锁定：无操作超时后锁定应用，需重新输入密码解锁
 */
export const useAutoLockStore = defineStore('autoLock', () => {
  const lockMinutes = ref<AutoLockMinutes>(
    normalizeLockMinutes(storage.get<number>(STORAGE_KEY, DEFAULT_AUTO_LOCK_MINUTES))
  )
  const isLocked = ref(storage.get<boolean>(LOCK_STATE_KEY, false) === true)
  /** 递增以通知 LockScreen 在已锁定状态下重新展示（如快捷键唤起窗口） */
  const lockPresentToken = ref(0)

  function persistLockState(locked: boolean): void {
    if (locked) {
      storage.set(LOCK_STATE_KEY, true)
    } else {
      storage.remove(LOCK_STATE_KEY)
    }
  }

  function requestLockPresentation(): void {
    if (isLocked.value) {
      lockPresentToken.value += 1
    }
  }

  function getIdleTimeoutMs(): number {
    return lockMinutes.value * 60 * 1000
  }

  function checkIdle(): void {
    if (lockMinutes.value === 0 || isLocked.value) return
    if (isMigrationActive()) return

    const idleMs = Date.now() - lastActivityAt
    if (idleMs >= getIdleTimeoutMs()) {
      lock()
    }
  }

  function startChecker(): void {
    clearCheckInterval()
    if (lockMinutes.value === 0 || isLocked.value) return
    if (isMigrationActive()) return
    checkInterval = setInterval(checkIdle, CHECK_INTERVAL_MS)
  }

  function setLockMinutes(minutes: AutoLockMinutes): void {
    lockMinutes.value = normalizeLockMinutes(minutes)
    storage.set(STORAGE_KEY, lockMinutes.value)
    lastActivityAt = Date.now()
    startChecker()
  }

  function touchActivity(): void {
    if (isLocked.value) return
    if (isMigrationActive()) return
    lastActivityAt = Date.now()
  }

  function lock(options?: { hideWindow?: boolean }): void {
    if (isMigrationActive()) return
    if (!useAuthStore().isLoggedIn) return
    if (!useSecurityStore().canUseVaultLock) return
    clearCheckInterval()
    const wasLocked = isLocked.value
    isLocked.value = true
    persistLockState(true)
    applySecureLockSideEffects()
    if (!wasLocked) {
      requestLockPresentation()
      if (options?.hideWindow !== false) {
        hideWindowAfterLock()
      }
    }
  }

  function unlock(): void {
    isLocked.value = false
    persistLockState(false)
    lastActivityAt = Date.now()
    startChecker()
    if (useAuthStore().isLoggedIn) {
      void useVaultStore().ensureLoaded()
    }
  }

  function start(): void {
    lastActivityAt = Date.now()
    startChecker()
  }

  /** 仅停止空闲检测，保留锁定状态（窗口关闭/组件卸载时使用） */
  function pauseMonitoring(): void {
    clearCheckInterval()
  }

  /** 停止检测并清除锁定（登出时使用） */
  function stop(): void {
    pauseMonitoring()
    isLocked.value = false
    persistLockState(false)
  }

  /** 应用启动时若处于锁定态，确保内存中无密钥与明文缓存 */
  function ensureSecureLockState(): void {
    if (isLocked.value) {
      applySecureLockSideEffects()
    }
  }

  /** 冷启动时若保险库已配置但未解锁，强制进入锁定态（需主密码） */
  function ensureVaultSessionLocked(): void {
    if (!useAuthStore().isLoggedIn) return

    const securityStore = useSecurityStore()
    if (!securityStore.isVaultConfigured || !securityStore.hasPersistedSecurityKey) {
      if (isLocked.value) {
        unlock()
      }
      return
    }

    if (isLocked.value) return
    if (securityStore.needsVaultUnlock) {
      isLocked.value = true
      persistLockState(true)
      applySecureLockSideEffects()
      requestLockPresentation()
    }
  }

  return {
    lockMinutes,
    isLocked,
    lockPresentToken,
    setLockMinutes,
    touchActivity,
    lock,
    unlock,
    start,
    pauseMonitoring,
    stop,
    requestLockPresentation,
    ensureSecureLockState,
    ensureVaultSessionLocked
  }
})
