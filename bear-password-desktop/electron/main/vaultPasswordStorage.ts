import { app, safeStorage } from 'electron'
import { existsSync } from 'fs'
import { readFile, unlink, writeFile } from 'fs/promises'
import { join } from 'path'

const VAULT_PASSWORD_FILE = 'vault-password.enc'
const LEGACY_ACCOUNT_PASSWORD_FILE = 'account-password.enc'

function getVaultPasswordPath(): string {
  return join(app.getPath('userData'), VAULT_PASSWORD_FILE)
}

function getLegacyAccountPasswordPath(): string {
  return join(app.getPath('userData'), LEGACY_ACCOUNT_PASSWORD_FILE)
}

export function isVaultPasswordEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable()
}

async function decryptPasswordFile(filePath: string): Promise<string | null> {
  if (!safeStorage.isEncryptionAvailable() || !existsSync(filePath)) {
    return null
  }

  try {
    const encrypted = await readFile(filePath)
    const decrypted = safeStorage.decryptString(encrypted)
    return decrypted || null
  } catch (error) {
    console.error('[vault-password] decrypt failed', error)
    return null
  }
}

export async function loadStoredVaultPassword(): Promise<string | null> {
  const current = await decryptPasswordFile(getVaultPasswordPath())
  if (current) return current

  const legacy = await decryptPasswordFile(getLegacyAccountPasswordPath())
  if (!legacy) return null

  const migrated = await saveStoredVaultPassword(legacy)
  if (migrated.ok) {
    await removeLegacyAccountPasswordFile()
  }
  return legacy
}

async function removeLegacyAccountPasswordFile(): Promise<void> {
  const legacyPath = getLegacyAccountPasswordPath()
  if (!existsSync(legacyPath)) return

  try {
    await unlink(legacyPath)
  } catch (error) {
    console.error('[vault-password] legacy remove failed', error)
  }
}

export async function saveStoredVaultPassword(
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
    await writeFile(getVaultPasswordPath(), encrypted)
    await removeLegacyAccountPasswordFile()
    return { ok: true }
  } catch (error) {
    console.error('[vault-password] encrypt failed', error)
    return { ok: false, error: '密码保存失败，请稍后重试' }
  }
}

export async function removeStoredVaultPassword(): Promise<void> {
  const filePath = getVaultPasswordPath()
  if (existsSync(filePath)) {
    try {
      await unlink(filePath)
    } catch (error) {
      console.error('[vault-password] remove failed', error)
    }
  }

  await removeLegacyAccountPasswordFile()
}
