import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useTrayStore } from '@/stores/tray'
import type { TrayClickAction } from '@/types/tray'

async function handleTrayAction(action: TrayClickAction): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return

  const autoLockStore = useAutoLockStore()
  if (autoLockStore.isLocked) {
    autoLockStore.requestLockPresentation()
    return
  }

  if (action === 'quick-search') {
    await router.push({ name: 'Vault' })
    useTrayStore().requestQuickSearchFocus()
  }
}

/** 绑定状态栏图标点击事件 */
export function initTrayBridge(): void {
  window.trayApi?.onAction((action) => {
    void handleTrayAction(action)
  })
}
