import router from '@/router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import { openVaultQuickSearch } from '@/utils/vaultQuickSearch'
import type { TrayRendererCommand } from '../../shared/trayMenu'

type TrayRouteName = 'Vault' | 'Favorites' | 'Recent' | 'Settings'

async function navigateWhenReady(routeName: TrayRouteName): Promise<void> {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return

  const autoLockStore = useAutoLockStore()
  if (autoLockStore.isLocked) {
    autoLockStore.requestLockPresentation()
    return
  }

  if (router.currentRoute.value.name !== routeName) {
    await router.push({ name: routeName })
  }
}

async function handleTrayCommand(command: TrayRendererCommand): Promise<void> {
  const appStore = useAppStore()
  const autoLockStore = useAutoLockStore()
  const securityStore = useSecurityStore()

  switch (command.action) {
    case 'quick-search':
      await openVaultQuickSearch()
      break
    case 'vault':
      await navigateWhenReady('Vault')
      break
    case 'favorites':
      await navigateWhenReady('Favorites')
      break
    case 'recent':
      await navigateWhenReady('Recent')
      break
    case 'lock':
      if (securityStore.isMigrating || autoLockStore.isLocked) return
      autoLockStore.lock()
      break
    case 'settings':
      await navigateWhenReady('Settings')
      break
    case 'set-theme':
      appStore.setThemePreference(command.value)
      break
    case 'set-locale':
      appStore.setLocalePreference(command.value)
      break
    case 'set-font':
      appStore.setFontPreference(command.value)
      break
    case 'open':
      break
  }
}

/** 绑定状态栏图标事件 */
export function initTrayBridge(): void {
  window.trayApi?.onCommand((command) => {
    void handleTrayCommand(command as TrayRendererCommand)
  })
}
