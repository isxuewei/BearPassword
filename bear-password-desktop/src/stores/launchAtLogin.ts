import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 开机自启（登录系统后自动启动应用）
 */
export const useLaunchAtLoginStore = defineStore('launchAtLogin', () => {
  const available = ref(false)
  const enabled = ref(false)
  const loading = ref(false)

  async function refresh(): Promise<void> {
    if (!window.launchAtLoginApi) {
      available.value = false
      enabled.value = false
      return
    }

    const settings = await window.launchAtLoginApi.getSettings()
    available.value = settings.available
    enabled.value = settings.enabled
  }

  async function setEnabled(value: boolean): Promise<{ ok: boolean; error?: string }> {
    if (!window.launchAtLoginApi) {
      return { ok: false, error: '当前环境不支持开机自启' }
    }

    loading.value = true
    try {
      const result = await window.launchAtLoginApi.setEnabled(value)
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
