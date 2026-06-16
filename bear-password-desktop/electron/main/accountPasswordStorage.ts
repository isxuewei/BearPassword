import { app, safeStorage } from 'electron'
import { existsSync } from 'fs'
import { readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'

const ACCOUNT_PASSWORD_FILE = 'account-password.enc'

function getAccountPasswordPath(): string {
  return join(app.getPath('userData'), ACCOUNT_PASSWORD_FILE)
}

export function isAccountPasswordEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

export async function loadStoredAccountPassword(): Promise<string | null> {
  if (!safeStorage.isEncryptionAvailable()) {
    return null
  }

  const filePath = getAccountPasswordPath()
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const encrypted = await readFile(filePath)
    const decrypted = safeStorage.decryptString(encrypted)
    return decrypted || null
  } catch (error) {
    console.error('[account-password] decrypt failed', error)
    return null
  }
}

export async function saveStoredAccountPassword(
  password: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!safeStorage.isEncryptionAvailable()) {
    return {
      ok: false,
      error: '当前系统无法使用安全存储，请检查钥匙串/凭据管理器是否可用'
    }
  }

  if (!password) {
    return { ok: false, error: '密码不能为空' }
  }

  try {
    const encrypted = safeStorage.encryptString(password)
    await writeFile(getAccountPasswordPath(), encrypted)
    return { ok: true }
  } catch (error) {
    console.error('[account-password] encrypt failed', error)
    return { ok: false, error: '密码保存失败，请稍后重试' }
  }
}

export async function removeStoredAccountPassword(): Promise<void> {
  const filePath = getAccountPasswordPath()
  if (!existsSync(filePath)) {
    return
  }

  try {
    await unlink(filePath)
  } catch (error) {
    console.error('[account-password] remove failed', error)
  }
}
