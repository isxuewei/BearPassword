import router from '@/router'
import { useAutoLockStore } from '@/stores/autoLock'
import { useTrayStore } from '@/stores/tray'
import { openVaultQuickSearch } from '@/utils/vaultQuickSearch'

/** 绑定灵动岛与主窗口的联动 */
export function initIslandBridge(): void {
  window.islandApi?.onOpenEntry((entryId) => {
    void openVaultQuickSearch().then(() => {
      useTrayStore().requestOpenEntry(entryId)
    })
  })

  window.islandApi?.onTouchActivity(() => {
    useAutoLockStore().touchActivity()
  })
}

/** 是否为灵动岛独立窗口模式 */
export function isIslandWindowMode(): boolean {
  return window.location.hash.startsWith('#/island')
}
