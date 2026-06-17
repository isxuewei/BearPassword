import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { TrayClickAction, TraySettings } from '@/types/tray'

/**
 * 状态栏图标配置与快捷搜索唤起
 */
export const useTrayStore = defineStore('tray', () => {
  const available = ref(false)
  const enabled = ref(true)
  const clickAction = ref<TrayClickAction>('vault')
  const loading = ref(false)
  /** 递增后通知密码库页聚焦搜索框 */
  const quickSearchFocusToken = ref(0)
  /** 递增后通知密码库页打开新增项目选择器 */
  const openCreateToken = ref(0)
  /** 递增后通知密码库页打开导入密码对话框 */
  const openImportToken = ref(0)

  async function refresh(): Promise<void> {
    if (!window.trayApi) {
      available.value = false
      return
    }

    const settings = await window.trayApi.getSettings()
    available.value = settings.available
    enabled.value = settings.enabled
    clickAction.value = settings.clickAction
  }

  async function updateSettings(
    partial: Partial<TraySettings>
  ): Promise<{ ok: boolean; error?: string }> {
    if (!window.trayApi) {
      return { ok: false, error: '当前环境不支持状态栏图标' }
    }

    loading.value = true
    try {
      const result = await window.trayApi.setSettings(partial)
      if (!result.ok) {
        return { ok: false, error: result.error }
      }

      available.value = result.settings.available
      enabled.value = result.settings.enabled
      clickAction.value = result.settings.clickAction
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  function requestQuickSearchFocus(): void {
    quickSearchFocusToken.value += 1
  }

  function requestOpenCreate(): void {
    openCreateToken.value += 1
  }

  function requestOpenImport(): void {
    openImportToken.value += 1
  }

  return {
    available,
    enabled,
    clickAction,
    loading,
    quickSearchFocusToken,
    openCreateToken,
    openImportToken,
    refresh,
    updateSettings,
    requestQuickSearchFocus,
    requestOpenCreate,
    requestOpenImport
  }
})
