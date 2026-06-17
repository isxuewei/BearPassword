import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  normalizeOfflineVaultSettings,
  OFFLINE_VAULT_SETTINGS_FILE,
  type OfflineVaultSettings
} from '../../shared/offlineVault'

export function getDefaultOfflineVaultDataDir(): string {
  return join(app.getPath('userData'), 'offline-vault')
}

function getSettingsFilePath(): string {
  return join(app.getPath('userData'), OFFLINE_VAULT_SETTINGS_FILE)
}

export function loadOfflineVaultSettings(): OfflineVaultSettings {
  const filePath = getSettingsFilePath()
  const defaultDataDir = getDefaultOfflineVaultDataDir()

  if (!existsSync(filePath)) {
    return normalizeOfflineVaultSettings(null, defaultDataDir)
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<OfflineVaultSettings>
    return normalizeOfflineVaultSettings(raw, defaultDataDir)
  } catch {
    return normalizeOfflineVaultSettings(null, defaultDataDir)
  }
}

export function saveOfflineVaultSettings(
  partial: Partial<OfflineVaultSettings>
): OfflineVaultSettings {
  const current = loadOfflineVaultSettings()
  const merged = normalizeOfflineVaultSettings(
    {
      enabled: partial.enabled ?? current.enabled,
      dataDir: partial.dataDir ?? current.dataDir
    },
    getDefaultOfflineVaultDataDir()
  )

  try {
    writeFileSync(getSettingsFilePath(), JSON.stringify(merged, null, 2), 'utf-8')
  } catch {
    // 写入失败不影响当前会话
  }

  return merged
}

export function ensureOfflineVaultDataDir(dataDir: string): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }
}
