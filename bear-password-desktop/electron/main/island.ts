import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import type { IslandSettings } from '../../shared/islandSettings'
import { loadIslandSettings, saveIslandSettings } from './islandConfig'

/** 灵动岛收起态窗口尺寸（与 UI 胶囊条一致） */
export const ISLAND_COLLAPSED = { width: 168, height: 38 }

/** 灵动岛展开态窗口尺寸 */
export const ISLAND_EXPANDED = { width: 440, height: 400 }

/** 距屏幕顶部的偏移 */
export const ISLAND_TOP_OFFSET = 6

let islandWindow: BrowserWindow | null = null
let isExpanded = false
let focusMainWindowHandler: (() => void) | null = null
let getMainWindowHandler: (() => BrowserWindow | null) | null = null

const isDev = !app.isPackaged

function getIslandBounds(expanded = isExpanded): Electron.Rectangle {
  const size = expanded ? ISLAND_EXPANDED : ISLAND_COLLAPSED
  const display = screen.getPrimaryDisplay()
  const { width: screenWidth } = display.workAreaSize
  const { x: screenX, y: screenY } = display.workArea

  return {
    x: Math.round(screenX + (screenWidth - size.width) / 2),
    y: Math.round(screenY + ISLAND_TOP_OFFSET),
    width: size.width,
    height: size.height
  }
}

export function isIslandAvailable(): boolean {
  return process.platform === 'darwin' || process.platform === 'win32'
}

function loadIslandUrl(win: BrowserWindow): void {
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(`${process.env['ELECTRON_RENDERER_URL']}#/island`)
    return
  }

  void win.loadFile(join(__dirname, '../renderer/index.html'), { hash: '/island' })
}

function createIslandWindow(): BrowserWindow {
  const isMac = process.platform === 'darwin'
  isExpanded = false

  const win = new BrowserWindow({
    ...getIslandBounds(false),
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    focusable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    ...(isMac ? { type: 'panel' as const } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })

  if (isMac) {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  win.setAlwaysOnTop(true, isMac ? 'floating' : 'screen-saver')

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.showInactive()
    }
  })

  loadIslandUrl(win)

  win.on('closed', () => {
    if (islandWindow === win) {
      islandWindow = null
      isExpanded = false
    }
  })

  return win
}

export function setIslandExpanded(expanded: boolean): void {
  if (!islandWindow || islandWindow.isDestroyed()) return
  if (isExpanded === expanded) {
    if (expanded) {
      islandWindow.focus()
    }
    return
  }

  isExpanded = expanded
  islandWindow.setBounds(getIslandBounds(expanded), true)

  if (expanded) {
    islandWindow.focus()
  }
}

function repositionIslandWindow(): void {
  if (!islandWindow || islandWindow.isDestroyed()) return
  islandWindow.setBounds(getIslandBounds(isExpanded))
}

export function destroyIslandWindow(): void {
  if (!islandWindow || islandWindow.isDestroyed()) return
  islandWindow.destroy()
  islandWindow = null
  isExpanded = false
}

export function applyIslandSettings(settings: IslandSettings = loadIslandSettings()): void {
  if (!isIslandAvailable() || !settings.enabled) {
    destroyIslandWindow()
    return
  }

  if (!islandWindow || islandWindow.isDestroyed()) {
    islandWindow = createIslandWindow()
    return
  }

  repositionIslandWindow()
  if (!islandWindow.isVisible()) {
    islandWindow.showInactive()
  }
}

export function registerIslandIpc(handlers: {
  focusMainWindow: () => void
  getMainWindow: () => BrowserWindow | null
}): void {
  focusMainWindowHandler = handlers.focusMainWindow
  getMainWindowHandler = handlers.getMainWindow

  ipcMain.handle('island:get', () => ({
    available: isIslandAvailable(),
    ...loadIslandSettings()
  }))

  ipcMain.handle('island:set', (_event, partial: Partial<IslandSettings>) => {
    try {
      const current = loadIslandSettings()
      const next = saveIslandSettings({
        enabled: partial.enabled ?? current.enabled
      })
      applyIslandSettings(next)
      return {
        ok: true as const,
        settings: {
          available: isIslandAvailable(),
          ...next
        }
      }
    } catch (error) {
      console.error('[island:set]', error)
      return {
        ok: false as const,
        error: '无法更新灵动岛设置，请稍后重试'
      }
    }
  })

  ipcMain.on('island:setExpanded', (_event, expanded: unknown) => {
    setIslandExpanded(expanded === true)
  })

  ipcMain.on('island:openEntry', (_event, entryId: unknown) => {
    if (typeof entryId !== 'number' || !Number.isFinite(entryId)) return
    focusMainWindowHandler?.()
    getMainWindowHandler?.()?.webContents.send('island:openEntry', entryId)
  })

  ipcMain.on('island:touchActivity', () => {
    getMainWindowHandler?.()?.webContents.send('island:touchActivity')
  })

  screen.on('display-metrics-changed', repositionIslandWindow)
}
