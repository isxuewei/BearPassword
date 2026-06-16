export interface AccountPasswordPersistResult {
  ok: boolean
  error?: string
}

function canUseAccountPasswordApi(): boolean {
  return typeof window !== 'undefined' && !!window.accountPasswordApi
}

export async function loadPersistedAccountPassword(): Promise<string | null> {
  if (!canUseAccountPasswordApi()) return null
  const password = await window.accountPasswordApi!.get()
  return password || null
}

export async function persistAccountPassword(password: string): Promise<AccountPasswordPersistResult> {
  if (!password) {
    return { ok: false, error: '密码不能为空' }
  }

  if (!canUseAccountPasswordApi()) {
    return { ok: false, error: '当前环境不支持安全存储' }
  }

  const result = await window.accountPasswordApi!.set(password)
  if (!result.ok) {
    return { ok: false, error: result.error ?? '密码保存失败' }
  }

  return { ok: true }
}

export async function clearPersistedAccountPassword(): Promise<void> {
  if (!canUseAccountPasswordApi()) return
  await window.accountPasswordApi!.remove()
}

export async function isSecureAccountPasswordStorageAvailable(): Promise<boolean> {
  if (!canUseAccountPasswordApi()) return false
  return window.accountPasswordApi!.isAvailable()
}
