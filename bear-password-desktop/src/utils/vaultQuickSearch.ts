import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useTrayStore } from '@/stores/tray'

/** 打开密码库并聚焦搜索框（已登录且未锁定时） */
export async function openVaultQuickSearch(): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return

  const autoLockStore = useAutoLockStore()
  if (autoLockStore.isLocked) {
    autoLockStore.requestLockPresentation()
    return
  }

  await router.push({ name: 'Vault' })
  useTrayStore().requestQuickSearchFocus()
}
