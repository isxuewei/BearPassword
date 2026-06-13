import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getLatestVersionApi } from '@/shared/api/version'
import { APP_VERSION } from '@/shared/constants/app'
import { isVersionNewer } from '@/shared/utils/versionCompare'
import { useSessionStore } from '@/popup/stores/session'

const EXTENSION_SYSTEM = 'Extension'

/** 扩展版本更新检查 */
export const useVersionStore = defineStore('version', () => {
  const hasUpdate = ref(false)
  const latestVersion = ref<string | null>(null)
  const downloadUrl = ref<string | null>(null)
  const checking = ref(false)
  const checked = ref(false)

  async function checkForUpdate(): Promise<void> {
    if (checking.value) return

    const origin = useSessionStore().serverOrigin
    if (!origin) {
      checked.value = true
      return
    }

    checking.value = true
    try {
      const latest = await getLatestVersionApi(origin, EXTENSION_SYSTEM)
      checked.value = true

      if (!latest?.versionCode) {
        hasUpdate.value = false
        latestVersion.value = null
        downloadUrl.value = null
        return
      }

      latestVersion.value = latest.versionCode
      downloadUrl.value = latest.downloadUrl
      hasUpdate.value = isVersionNewer(latest.versionCode, APP_VERSION)
    } catch {
      checked.value = true
    } finally {
      checking.value = false
    }
  }

  function openDownload(): void {
    if (!downloadUrl.value) return
    window.open(downloadUrl.value, '_blank', 'noopener,noreferrer')
  }

  return {
    hasUpdate,
    latestVersion,
    downloadUrl,
    checking,
    checked,
    checkForUpdate,
    openDownload
  }
})
