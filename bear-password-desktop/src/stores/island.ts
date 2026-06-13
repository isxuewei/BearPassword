import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 顶部灵动岛配置
 */
export const useIslandStore = defineStore('island', () => {
  const available = ref(false)
  const enabled = ref(true)
  const loading = ref(false)

  async function refresh(): Promise<void> {
    if (!window.islandApi) {
      available.value = false
      return
    }

    const settings = await window.islandApi.getSettings()
    available.value = settings.available
    enabled.value = settings.enabled
  }

  async function setEnabled(value: boolean): Promise<{ ok: boolean; error?: string }> {
    if (!window.islandApi) {
      return { ok: false, error: '当前环境不支持灵动岛' }
    }

    loading.value = true
    try {
      const result = await window.islandApi.setSettings({ enabled: value })
      if (!result.ok) {
        return { ok: false, error: result.error }
      }

      available.value = result.settings.available
      enabled.value = result.settings.enabled
      return { ok: true }
    } finally {
      loading.value = false
    }
  }

  return {
    available,
    enabled,
    loading,
    refresh,
    setEnabled
  }
})
