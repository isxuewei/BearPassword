import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_TRAY_SETTINGS,
  normalizeTraySettings,
  type TraySettings
} from '../../shared/traySettings'

export function loadTraySettings(): TraySettings {
  const filePath = join(app.getPath('userData'), 'tray.json')

  if (!existsSync(filePath)) {
    return { ...DEFAULT_TRAY_SETTINGS }
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<TraySettings>
    return normalizeTraySettings(raw)
  } catch {
    return { ...DEFAULT_TRAY_SETTINGS }
  }
}

export function saveTraySettings(settings: TraySettings): TraySettings {
  const normalized = normalizeTraySettings(settings)
  const filePath = join(app.getPath('userData'), 'tray.json')

  try {
    writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf-8')
  } catch {
    // 写入失败不影响当前会话内的配置
  }

  return normalized
}
