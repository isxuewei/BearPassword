import { ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * 密码库页 UI 唤起（Dashboard / 快捷键等跨路由触发）
 */
export const useVaultUiStore = defineStore('vaultUi', () => {
  /** 递增后通知密码库页打开新增项目选择器 */
  const openCreateToken = ref(0)
  /** 递增后通知密码库页聚焦搜索框 */
  const quickSearchFocusToken = ref(0)

  function requestOpenCreate(): void {
    openCreateToken.value += 1
  }

  function requestQuickSearchFocus(): void {
    quickSearchFocusToken.value += 1
  }

  return {
    openCreateToken,
    quickSearchFocusToken,
    requestOpenCreate,
    requestQuickSearchFocus
  }
})
