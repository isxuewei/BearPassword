import { app } from 'electron'
import type { DockSettings } from '../../shared/dockSettings'

export function isDockIconAvailable(): boolean {
  return process.platform === 'darwin'
}

/** 应用 Dock 栏图标显示/隐藏 */
export function applyDockIconVisibility(settings: DockSettings): void {
  if (!isDockIconAvailable() || !app.dock) return

  if (settings.hidden) {
    app.dock.hide()
    return
  }

  app.dock.show()
}

/** 聚焦窗口时是否应显示 Dock（用户未选择隐藏时） */
export function shouldShowDockOnFocus(settings: DockSettings): boolean {
  return isDockIconAvailable() && !settings.hidden
}
