import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  API_CONTEXT_PATH,
  getDefaultServerOrigin,
  getServerBaseUrl,
  getServerOrigin,
  isCustomServerOrigin,
  normalizeServerOrigin,
  resetServerOrigin,
  saveServerOrigin
} from '@/utils/serverUrl'

/**
 * 后端服务器地址配置（本地持久化）
 */
export const useServerStore = defineStore('server', () => {
  const serverOrigin = ref(getServerOrigin())
  const defaultServerOrigin = getDefaultServerOrigin()
  const apiBaseUrl = computed(() => `${serverOrigin.value}${API_CONTEXT_PATH}`)
  /** 地址变更计数，供各页面重新拉取数据 */
  const revision = ref(0)

  const isCustom = computed(() => isCustomServerOrigin())

  function bumpRevision(): void {
    revision.value += 1
  }

  function setServerOrigin(input: string): string {
    const normalized = saveServerOrigin(input)
    if (serverOrigin.value !== normalized) {
      serverOrigin.value = normalized
      bumpRevision()
    }
    return normalized
  }

  function restoreDefault(): string {
    resetServerOrigin()
    const next = defaultServerOrigin
    if (serverOrigin.value !== next) {
      serverOrigin.value = next
      bumpRevision()
    }
    return serverOrigin.value
  }

  function validate(input: string): string {
    return normalizeServerOrigin(input)
  }

  function syncFromStorage(): void {
    serverOrigin.value = getServerOrigin()
  }

  /** @deprecated 兼容旧引用，等同 apiBaseUrl */
  const baseUrl = apiBaseUrl
  const defaultBaseUrl = computed(() => `${defaultServerOrigin}${API_CONTEXT_PATH}`)

  return {
    serverOrigin,
    apiBaseUrl,
    defaultServerOrigin,
    revision,
    baseUrl,
    defaultBaseUrl,
    isCustom,
    setServerOrigin,
    restoreDefault,
    validate,
    syncFromStorage,
    /** @deprecated 使用 setServerOrigin */
    setBaseUrl: setServerOrigin
  }
})
