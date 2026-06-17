import { ref } from 'vue'
import { defineStore } from 'pinia'

/** 扩展版本更新检查（桌面桥接模式下暂不检查后端版本） */
export const useVersionStore = defineStore('version', () => {
  const hasUpdate = ref(false)
  const latestVersion = ref<string | null>(null)
  const downloadUrl = ref<string | null>(null)
  const checking = ref(false)
  const checked = ref(false)

  async function checkForUpdate(): Promise<void> {
    checked.value = true
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
