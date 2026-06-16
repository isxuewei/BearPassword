export interface VaultPasswordPersistResult {
  ok: boolean
  error?: string
}

function canUseVaultPasswordApi(): boolean {
  return typeof window !== 'undefined' && !!window.vaultPasswordApi
}

export async function loadPersistedVaultPassword(): Promise<string | null> {
  if (!canUseVaultPasswordApi()) return null
  const password = await window.vaultPasswordApi!.get()
  return password || null
}

export async function persistVaultPassword(password: string): Promise<VaultPasswordPersistResult> {
  if (!password) {
    return { ok: false, error: '密码不能为空' }
  }

  if (!canUseVaultPasswordApi()) {
    return { ok: false, error: '当前环境不支持安全存储' }
  }

  const result = await window.vaultPasswordApi!.set(password)
  if (!result.ok) {
    return { ok: false, error: result.error ?? '密码保存失败' }
  }

  return { ok: true }
}

export async function clearPersistedVaultPassword(): Promise<void> {
  if (!canUseVaultPasswordApi()) return
  await window.vaultPasswordApi!.remove()
}

export async function isSecureVaultPasswordStorageAvailable(): Promise<boolean> {
  if (!canUseVaultPasswordApi()) return false
  return window.vaultPasswordApi!.isAvailable()
}
