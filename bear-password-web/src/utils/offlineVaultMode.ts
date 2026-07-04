/** Web 端不支持离线保险库，始终返回 false */
export function shouldUseOfflineVault(): boolean {
  return false
}

export function isOfflineVaultMode(): boolean {
  return false
}
