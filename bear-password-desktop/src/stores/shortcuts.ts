import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  DEFAULT_SHORTCUT_SETTINGS,
  type ShortcutActionId,
  type ShortcutSettings,
  type ShortcutSyncResult,
  type ShortcutRegistrationStatus
} from '@/types/shortcut'
import { isBrokenAccelerator, normalizeAcceleratorString } from '../../shared/acceleratorMatch'
import { isValidShortcutAccelerator } from '@/utils/shortcut'
import { storage } from '@/utils/storage'

const STORAGE_KEY = 'shortcuts'

const LEGACY_DEFAULTS: Record<string, string> = {
  'CommandOrControl+Shift+B': DEFAULT_SHORTCUT_SETTINGS.open,
  'CommandOrControl+Shift+L': DEFAULT_SHORTCUT_SETTINGS.lock
}

function normalizeAccelerator(value: unknown, fallback: string | null): string | null {
  if (value === null) return null
  if (typeof value !== 'string' || !value.trim()) return fallback

  const migrated = LEGACY_DEFAULTS[value] ?? value
  if (isBrokenAccelerator(migrated)) return fallback
  return normalizeAcceleratorString(migrated)
}

function normalizeSettings(value: unknown): ShortcutSettings {
  const source = value && typeof value === 'object' ? (value as Partial<ShortcutSettings>) : {}
  return {
    open: normalizeAccelerator(source.open, DEFAULT_SHORTCUT_SETTINGS.open),
    lock: normalizeAccelerator(source.lock, DEFAULT_SHORTCUT_SETTINGS.lock)
  }
}

/**
 * 全局快捷键配置
 */
export const useShortcutsStore = defineStore('shortcuts', () => {
  const settings = ref<ShortcutSettings>(
    normalizeSettings(storage.get<ShortcutSettings>(STORAGE_KEY, DEFAULT_SHORTCUT_SETTINGS))
  )
  const lastSyncError = ref<Partial<Record<ShortcutActionId, string>>>({})
  const registrationStatus = ref<ShortcutRegistrationStatus | null>(null)

  function persist(): void {
    storage.set(STORAGE_KEY, settings.value)
  }

  function getPlainBindings(): ShortcutSettings {
    return {
      open: settings.value.open,
      lock: settings.value.lock
    }
  }

  async function syncToMain(): Promise<ShortcutSyncResult> {
    if (!window.shortcutApi) {
      lastSyncError.value = {}
      registrationStatus.value = null
      return { ok: true }
    }

    // IPC 只能传递普通对象，不能传 Pinia/Vue 的响应式 Proxy
    const result = await window.shortcutApi.sync(getPlainBindings())
    lastSyncError.value = result.failed ?? {}
    registrationStatus.value = result.status ?? null
    return result
  }

  async function init(): Promise<void> {
    const normalized = normalizeSettings(settings.value)
    if (
      normalized.open !== settings.value.open ||
      normalized.lock !== settings.value.lock
    ) {
      settings.value = normalized
      persist()
    }
    await syncToMain()
  }

  async function setAccelerator(action: ShortcutActionId, accelerator: string | null): Promise<ShortcutSyncResult> {
    const normalizedAccelerator = accelerator ? normalizeAcceleratorString(accelerator) : null

    if (normalizedAccelerator && !isValidShortcutAccelerator(normalizedAccelerator)) {
      return { ok: false, failed: { [action]: '请使用组合键（如 Ctrl+Shift+B）' } }
    }

    const otherAction: ShortcutActionId = action === 'open' ? 'lock' : 'open'
    if (normalizedAccelerator && settings.value[otherAction] === normalizedAccelerator) {
      return { ok: false, failed: { [action]: '不能与另一快捷键相同' } }
    }

    settings.value = { ...settings.value, [action]: normalizedAccelerator }
    persist()

    try {
      return await syncToMain()
    } catch {
      return { ok: false, failed: { [action]: '同步快捷键到系统失败，请重启应用后重试' } }
    }
  }

  async function resetDefaults(): Promise<ShortcutSyncResult> {
    settings.value = { ...DEFAULT_SHORTCUT_SETTINGS }
    persist()
    return syncToMain()
  }

  return {
    settings,
    lastSyncError,
    registrationStatus,
    init,
    syncToMain,
    setAccelerator,
    resetDefaults
  }
})
