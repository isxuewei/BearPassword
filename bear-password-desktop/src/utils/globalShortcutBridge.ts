import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import { useShortcutsStore } from '@/stores/shortcuts'
import { openVaultQuickSearch } from '@/utils/vaultQuickSearch'
import { keyboardEventToShortcutInput, matchAccelerator } from '../../shared/acceleratorMatch'

function handleLockShortcut(): void {
  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) return

  const securityStore = useSecurityStore()
  if (securityStore.isMigrating) return

  const autoLockStore = useAutoLockStore()
  if (!autoLockStore.isLocked) {
    autoLockStore.lock()
  }
}

function handleOpenShortcut(): void {
  void openVaultQuickSearch()
}

function isRecordingShortcut(event: KeyboardEvent): boolean {
  return !!(event.target as HTMLElement | null)?.closest('.shortcut-input--recording')
}

/** 绑定快捷键：后台走主进程 IPC，前台直接读 Pinia 最新配置 */
export function initGlobalShortcutBridge(): void {
  window.shortcutApi?.onLock(handleLockShortcut)
  window.shortcutApi?.onOpen(handleOpenShortcut)

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.repeat || isRecordingShortcut(event)) return

      const { lock } = useShortcutsStore().settings
      if (!lock) return

      const input = keyboardEventToShortcutInput(event)

      if (lock && matchAccelerator(input, lock)) {
        event.preventDefault()
        event.stopPropagation()
        handleLockShortcut()
      }
    },
    true
  )
}
