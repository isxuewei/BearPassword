/** 供 API 层判断当前是否处于离线模式（由 offlineVault store 同步） */
let offlineVaultEnabled = false

export function setOfflineVaultModeEnabled(enabled: boolean): void {
  offlineVaultEnabled = enabled
}

export function isOfflineVaultMode(): boolean {
  return offlineVaultEnabled
}

export function isOfflineVaultApiAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.offlineVaultApi
}
