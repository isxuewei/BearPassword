import { Menu, Tray, nativeImage } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import type { TrayClickAction, TraySettings } from '../../shared/traySettings'
import {
  TRAY_FONT_VALUES,
  TRAY_LOCALE_VALUES,
  TRAY_THEME_VALUES,
  type TrayAppearanceSnapshot,
  type TrayFontValue,
  type TrayLocaleValue,
  type TrayThemeValue
} from '../../shared/trayMenu'
import { loadTrayAppearanceSnapshot } from './trayAppearance'

let tray: Tray | null = null

const TRAY_ICON_SIZE = process.platform === 'win32' ? 16 : 22

export interface TrayActionHandlers {
  onOpen: () => void
  onVault: () => void
  onFavorites: () => void
  onRecent: () => void
  onLock: () => void
  onSettings: () => void
  onSetTheme: (value: TrayThemeValue) => void
  onSetLocale: (value: TrayLocaleValue) => void
  onSetFont: (value: TrayFontValue) => void
  onQuit: () => void
}

/** 解析状态栏 / 系统托盘图标路径 */
export function resolveTrayIconPath(getIconBaseDir: () => string): string | undefined {
  const baseDir = getIconBaseDir()
  const candidates =
    process.platform === 'win32'
      ? ['icon.ico', 'tray-icon.png', 'icon.png']
      : ['tray-icon.png', 'icon.png']

  for (const name of candidates) {
    const iconPath = join(baseDir, name)
    if (existsSync(iconPath)) {
      return iconPath
    }
  }
  return undefined
}

function buildTrayImage(getIconBaseDir: () => string): Electron.NativeImage | null {
  const iconPath = resolveTrayIconPath(getIconBaseDir)
  if (!iconPath) return null

  let image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) return null

  if (process.platform === 'win32' && iconPath.endsWith('.ico')) {
    return image
  }

  image = image.resize({ width: TRAY_ICON_SIZE, height: TRAY_ICON_SIZE, quality: 'best' })

  // macOS 菜单栏模板图标：随浅色/深色菜单栏自动反色
  if (process.platform === 'darwin') {
    image.setTemplateImage(true)
  }

  return image
}

function handleTrayClick(action: TrayClickAction, handlers: TrayActionHandlers): void {
  switch (action) {
    case 'favorites':
      handlers.onFavorites()
      return
    case 'recent':
      handlers.onRecent()
      return
    case 'settings':
      handlers.onSettings()
      return
    case 'vault':
    default:
      handlers.onVault()
  }
}

function buildTrayContextMenu(
  handlers: TrayActionHandlers,
  snapshot: TrayAppearanceSnapshot = loadTrayAppearanceSnapshot()
): Menu {
  const labels = snapshot.labels

  return Menu.buildFromTemplate([
    { label: labels.open, click: handlers.onOpen },
    { label: labels.lock, click: handlers.onLock },
    { label: labels.settings, click: handlers.onSettings },
    { type: 'separator' },
    {
      label: labels.theme,
      submenu: TRAY_THEME_VALUES.map((value) => ({
        type: 'radio' as const,
        label: labels.themes[value] ?? value,
        checked: snapshot.theme === value,
        click: () => handlers.onSetTheme(value)
      }))
    },
    {
      label: labels.language,
      submenu: TRAY_LOCALE_VALUES.map((value) => ({
        type: 'radio' as const,
        label: labels.locales[value] ?? value,
        checked: snapshot.locale === value,
        click: () => handlers.onSetLocale(value)
      }))
    },
    {
      label: labels.font,
      submenu: TRAY_FONT_VALUES.map((value) => ({
        type: 'radio' as const,
        label: labels.fonts[value] ?? value,
        checked: snapshot.font === value,
        click: () => handlers.onSetFont(value)
      }))
    },
    { type: 'separator' },
    { label: labels.quit, click: handlers.onQuit }
  ])
}

/** 按配置创建或更新系统托盘 / 菜单栏图标 */
export function applyTraySettings(
  settings: TraySettings,
  handlers: TrayActionHandlers,
  getIconBaseDir: () => string
): Tray | null {
  destroyTray()

  if (!isTrayAvailable() || !settings.enabled) {
    return null
  }

  const image = buildTrayImage(getIconBaseDir)
  if (!image) return null

  tray = new Tray(image)
  tray.setToolTip('BearPassword')

  tray.on('click', () => {
    handleTrayClick(settings.clickAction, handlers)
  })

  // 左键执行配置动作；右键弹出菜单（macOS / Windows 统一）
  tray.on('right-click', () => {
    tray?.popUpContextMenu(buildTrayContextMenu(handlers))
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
  return process.platform === 'darwin' || process.platform === 'win32'
}
