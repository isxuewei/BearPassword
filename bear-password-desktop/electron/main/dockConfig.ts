import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_DOCK_SETTINGS,
  normalizeDockSettings,
  type DockSettings
} from '../../shared/dockSettings'

export function loadDockSettings(): DockSettings {
  const filePath = join(app.getPath('userData'), 'dock.json')

  if (!existsSync(filePath)) {
    return { ...DEFAULT_DOCK_SETTINGS }
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<DockSettings>
    return normalizeDockSettings(raw)
  } catch {
    return { ...DEFAULT_DOCK_SETTINGS }
  }
}

export function saveDockSettings(settings: DockSettings): DockSettings {
  const normalized = normalizeDockSettings(settings)
  const filePath = join(app.getPath('userData'), 'dock.json')

  try {
    writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf-8')
  } catch {
    // 写入失败不影响当前会话内的配置
  }

  return normalized
}
