import { app, Menu, Tray, nativeImage } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import type { TrayClickAction, TraySettings } from '../../shared/traySettings'

let tray: Tray | null = null

/** macOS 状态栏图标显示尺寸（pt） */
const TRAY_ICON_SIZE = 22

export interface TrayActionHandlers {
  onOpen: () => void
  onQuickSearch: () => void
}

/** 解析状态栏图标路径 */
export function resolveTrayIconPath(getIconBaseDir: () => string): string | undefined {
  const iconPath = join(getIconBaseDir(), 'tray-icon.png')
  return existsSync(iconPath) ? iconPath : undefined
}

function buildTrayImage(getIconBaseDir: () => string): Electron.NativeImage | null {
  const iconPath = resolveTrayIconPath(getIconBaseDir)
  if (!iconPath) return null

  let image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) return null

  return image.resize({ width: TRAY_ICON_SIZE, height: TRAY_ICON_SIZE, quality: 'best' })
}

function handleTrayClick(action: TrayClickAction, handlers: TrayActionHandlers): void {
  if (action === 'quick-search') {
    handlers.onQuickSearch()
    return
  }
  handlers.onOpen()
}

/** 按配置创建或更新 macOS 状态栏图标 */
export function applyTraySettings(
  settings: TraySettings,
  handlers: TrayActionHandlers,
  getIconBaseDir: () => string
): Tray | null {
  destroyTray()

  if (process.platform !== 'darwin' || !settings.enabled) {
    return null
  }

  const image = buildTrayImage(getIconBaseDir)
  if (!image) return null

  tray = new Tray(image)
  tray.setToolTip('BearPassword')

  tray.on('click', () => {
    handleTrayClick(settings.clickAction, handlers)
  })

  const contextMenu = Menu.buildFromTemplate([
    { label: '打开 BearPassword', click: handlers.onOpen },
    { label: '打开快捷搜索', click: handlers.onQuickSearch },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ])

  // macOS 下 setContextMenu 会让左键也弹出菜单，改为仅右键弹出
  tray.on('right-click', () => {
    tray?.popUpContextMenu(contextMenu)
  })

  return tray
}

/** 销毁状态栏图标 */
export function destroyTray(): void {
  if (!tray) return
  tray.destroy()
  tray = null
}

export function isTrayAvailable(): boolean {
  return process.platform === 'darwin'
}
