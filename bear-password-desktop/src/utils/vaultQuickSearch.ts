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
  useTrayStore().requestOpenCreate()
}

/** 打开密码库并弹出导入密码对话框（已登录且未锁定时） */
export async function openVaultImport(): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return

  const autoLockStore = useAutoLockStore()
  if (autoLockStore.isLocked) {
    autoLockStore.requestLockPresentation()
    return
  }

  await router.push({ name: 'Vault' })
  useTrayStore().requestOpenImport()
}
