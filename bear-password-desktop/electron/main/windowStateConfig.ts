import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  getDefaultWindowState,
  normalizeWindowState,
  type WindowState
} from '../../shared/windowState'

export function loadWindowState(minWidth: number, minHeight: number): WindowState {
  const filePath = join(app.getPath('userData'), 'window-state.json')

  if (!existsSync(filePath)) {
    return getDefaultWindowState(minWidth, minHeight)
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<WindowState>
    return normalizeWindowState(raw, minWidth, minHeight)
  } catch {
    return getDefaultWindowState(minWidth, minHeight)
  }
}

export function saveWindowState(state: WindowState): void {
  try {
    const filePath = join(app.getPath('userData'), 'window-state.json')
    writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8')
  } catch {
    // 写入失败不影响当前会话
  }
}
