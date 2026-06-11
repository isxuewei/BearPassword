import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * macOS Dock 栏图标显示配置
 */
export const useDockStore = defineStore('dock', () => {
  const available = ref(false)
  const hidden = ref(false)
  const loading = ref(false)

  async function refresh(): Promise<void> {
    if (!window.dockApi) {
      available.value = false
      return
    }

    const settings = await window.dockApi.getSettings()
    available.value = settings.available
    hidden.value = settings.hidden
  }

  async function setHidden(value: boolean): Promise<{ ok: boolean; error?: string }> {
    if (!window.dockApi) {
      return { ok: false, error: '当前环境不支持 Dock 栏设置' }
    }

    loading.value = true
    try {
      const result = await window.dockApi.setHidden(value)
      if (!result.ok) {
        return { ok: false, error: result.error }
      }

      available.value = result.settings.available
      hidden.value = result.settings.hidden
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  return {
    available,
    hidden,
    loading,
    refresh,
    setHidden
  }
})
