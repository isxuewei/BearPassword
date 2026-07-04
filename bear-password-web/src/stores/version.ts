import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getLatestVersionApi } from '@/api/version'
import { APP_VERSION } from '@/constants/app'
import { formatSystemLabel, resolveSystemType } from '@/utils/platform'
import { isVersionNewer } from '@/utils/versionCompare'

/**
 * 客户端版本更新检查
 */
export const useVersionStore = defineStore('version', () => {
  const hasUpdate = ref(false)
  const latestVersion = ref<string | null>(null)
  const downloadUrl = ref<string | null>(null)
  const systemType = ref('MacOS')
  const checking = ref(false)
  const checked = ref(false)

  async function detectPlatform(): Promise<NodeJS.Platform> {
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('win')) return 'win32'
    if (ua.includes('mac')) return 'darwin'
    if (ua.includes('linux')) return 'linux'
    return 'darwin'
  }

  async function refreshSystemType(): Promise<void> {
    const platform = await detectPlatform()
    systemType.value = formatSystemLabel(platform)
  }

  async function checkForUpdate(): Promise<void> {
    if (checking.value) return

    checking.value = true
    try {
      const platform = await detectPlatform()
      systemType.value = formatSystemLabel(platform)
      const latest = await getLatestVersionApi(resolveSystemType(platform))
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
    systemType,
    checking,
    checked,
    refreshSystemType,
    checkForUpdate,
    openDownload
  }
})
