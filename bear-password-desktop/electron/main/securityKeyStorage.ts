import { app, safeStorage } from 'electron'
import { existsSync } from 'fs'
import { readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'

const SECURITY_KEY_FILE = 'security-key.enc'

function getSecurityKeyPath(): string {
  return join(app.getPath('userData'), SECURITY_KEY_FILE)
}

export function isSecurityKeyEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

export async function loadStoredSecurityKey(): Promise<string | null> {
  if (!safeStorage.isEncryptionAvailable()) {
    return null
  }

  const filePath = getSecurityKeyPath()
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const encrypted = await readFile(filePath)
    const decrypted = safeStorage.decryptString(encrypted)
    const normalized = decrypted.trim()
    return normalized || null
  } catch (error) {
    console.error('[security-key] decrypt failed', error)
    return null
  }
}

export async function saveStoredSecurityKey(key: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!safeStorage.isEncryptionAvailable()) {
    return {
      ok: false,
      error: '当前系统无法使用安全存储，请检查钥匙串/凭据管理器是否可用'
    }
  }

  const normalized = key.trim()
  if (!normalized) {
    return { ok: false, error: '安全密钥不能为空' }
  }

  try {
    const encrypted = safeStorage.encryptString(normalized)
    await writeFile(getSecurityKeyPath(), encrypted)
    return { ok: true }
  } catch (error) {
    console.error('[security-key] encrypt failed', error)
    return { ok: false, error: '安全密钥保存失败，请稍后重试' }
  }
}

export async function removeStoredSecurityKey(): Promise<void> {
  const filePath = getSecurityKeyPath()
  if (!existsSync(filePath)) {
    return
  }

  try {
    await unlink(filePath)
  } catch (error) {
    console.error('[security-key] remove failed', error)
  }
}
