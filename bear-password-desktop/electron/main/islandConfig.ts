import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_ISLAND_SETTINGS,
  normalizeIslandSettings,
  type IslandSettings
} from '../../shared/islandSettings'

export function loadIslandSettings(): IslandSettings {
  const filePath = join(app.getPath('userData'), 'island.json')

  if (!existsSync(filePath)) {
    return { ...DEFAULT_ISLAND_SETTINGS }
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<IslandSettings>
    return normalizeIslandSettings(raw)
  } catch {
    return { ...DEFAULT_ISLAND_SETTINGS }
  }
}

export function saveIslandSettings(settings: IslandSettings): IslandSettings {
  const normalized = normalizeIslandSettings(settings)
  const filePath = join(app.getPath('userData'), 'island.json')

  try {
    writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf-8')
  } catch {
    // 写入失败不影响当前会话内的配置
  }

  return normalized
}
