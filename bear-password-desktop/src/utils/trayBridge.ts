import { openVaultQuickSearch } from '@/utils/vaultQuickSearch'
import type { TrayClickAction } from '@/types/tray'

async function handleTrayAction(action: TrayClickAction): Promise<void> {
  if (action === 'quick-search') {
    await openVaultQuickSearch()
  }
}

/** 绑定状态栏图标点击事件 */
export function initTrayBridge(): void {
  window.trayApi?.onAction((action) => {
    void handleTrayAction(action)
  })
}
