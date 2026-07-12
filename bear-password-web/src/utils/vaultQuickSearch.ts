import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useVaultUiStore } from '@/stores/vaultUi'

export async function openVaultQuickSearch(): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return

  const autoLockStore = useAutoLockStore()
  if (autoLockStore.isLocked) {
    autoLockStore.requestLockPresentation()
    return
  }

  await router.push({ name: 'Vault' })
  useVaultUiStore().requestQuickSearchFocus()
}

/** 打开密码库并弹出新增项目选择器（已登录且未锁定时） */
export async function openVaultCreate(): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return

  const autoLockStore = useAutoLockStore()
  if (autoLockStore.isLocked) {
    autoLockStore.requestLockPresentation()
    return
  }

  await router.push({ name: 'Vault' })
  useVaultUiStore().requestOpenCreate()
}
