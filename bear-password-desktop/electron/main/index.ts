import { app, BrowserWindow, ipcMain, nativeImage, nativeTheme, shell } from 'electron'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  syncGlobalShortcuts,
  unregisterAllGlobalShortcuts,
  attachFocusedShortcutListener,
  getShortcutRegistrationStatus,
  type ShortcutBindings
} from './shortcuts'
import { loadShortcutBindings } from './shortcutConfig'
import { getLaunchAtLoginSettings, setLaunchAtLogin } from './launchAtLogin'
import type { TrayClickAction, TraySettings } from '../../shared/traySettings'
import { loadTraySettings, saveTraySettings } from './trayConfig'
import { applyTraySettings, destroyTray, isTrayAvailable } from './tray'
import { loadDockSettings, saveDockSettings } from './dockConfig'
import { applyDockIconVisibility, isDockIconAvailable, shouldShowDockOnFocus } from './dock'
import {
  applyWindowState,
  attachMainWindowStateListeners,
  flushPendingWindowStateSave,
  getCachedWindowState,
  persistMainWindowState,
  seedCachedWindowState
} from './windowState'

/** 主窗口实例引用，用于窗口控制 IPC */
let mainWindow: BrowserWindow | null = null

/** 主窗口最小尺寸（亦为默认启动尺寸） */
const WINDOW_MIN_WIDTH = 1024
const WINDOW_MIN_HEIGHT = 640

/** 判断是否为开发环境 */
const isDev = !app.isPackaged

/** 图标资源目录 */
function getIconBaseDir(): string {
  return app.isPackaged ? join(process.resourcesPath, 'icons') : join(__dirname, '../../resources')
}

/** 解析应用图标路径（按平台优先选择格式） */
function resolveAppIconPath(): string | undefined {
  const baseDir = getIconBaseDir()
  const candidates =
    process.platform === 'win32'
      ? ['icon.ico', 'icon.png']
      : process.platform === 'darwin'
        ? ['icon.icns', 'icon.png']
        : ['icon.png', 'icon.ico']

  for (const name of candidates) {
    const iconPath = join(baseDir, name)
    if (existsSync(iconPath)) {
      return iconPath
    }
  }
  return undefined
}

/** 设置 Dock / 任务栏图标 */
function applyAppIcon(): void {
  const iconPath = resolveAppIconPath()
  if (!iconPath) return

  const image = nativeImage.createFromPath(iconPath)
  if (image.isEmpty()) return

  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(image)
  }
}

/**
 * 创建主窗口
 * - 无边框设计，使用自定义标题栏
 * - macOS 使用 hiddenInset 保留原生交通灯位置
 */
function createWindow(notifyOpenOnLoad = false): void {
  const isMac = process.platform === 'darwin'
  const iconPath = resolveAppIconPath()
  const savedState = seedCachedWindowState(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)

  mainWindow = new BrowserWindow({
    width: savedState.width,
    height: savedState.height,
    ...(savedState.x !== undefined && savedState.y !== undefined
      ? { x: savedState.x, y: savedState.y }
      : {}),
    minWidth: WINDOW_MIN_WIDTH,
    minHeight: WINDOW_MIN_HEIGHT,
    show: false,
    frame: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 16, y: 18 } : undefined,
    backgroundColor: '#f4f4f8',
    ...(iconPath ? { icon: iconPath } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // 桌面端需连接用户自定义的后端地址，关闭同源限制以避免跨域 Network Error
      webSecurity: false
    }
  })

  attachMainWindowStateListeners(mainWindow, WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)

  // 窗口准备好后再显示，避免白屏闪烁
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (savedState.isMaximized) {
      mainWindow.maximize()
    }
    mainWindow.show()
  })

  if (notifyOpenOnLoad) {
    mainWindow.webContents.once('did-finish-load', () => {
      if (!mainWindow?.isDestroyed()) {
        mainWindow.webContents.send('shortcut:open')
      }
    })
  }

  attachFocusedShortcutListener(mainWindow)

  // 外部链接使用跟随系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 开发环境加载 Vite 开发服务器，生产环境加载打包后的 HTML
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/** 注册窗口控制 IPC 处理器 */
function registerWindowIpc(): void {
  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window:close', () => {
    mainWindow?.close()
  })

  ipcMain.on('window:hide', () => {
    hideMainWindow()
  })

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  ipcMain.handle('window:getPlatform', () => {
    return process.platform
  })
}

/** 注册系统主题 IPC，供渲染进程跟随 macOS / Windows 外观 */
function registerThemeIpc(): void {
  nativeTheme.themeSource = 'system'

  ipcMain.handle('theme:shouldUseDarkColors', () => nativeTheme.shouldUseDarkColors)

  const broadcastThemeUpdate = (): void => {
    const shouldUseDarkColors = nativeTheme.shouldUseDarkColors
    BrowserWindow.getAllWindows().forEach((win) => {
      if (!win.isDestroyed()) {
        win.webContents.send('theme:updated', shouldUseDarkColors)
      }
    })
  }

  nativeTheme.on('updated', broadcastThemeUpdate)
}

function showDockIfNeeded(): void {
  if (shouldShowDockOnFocus(loadDockSettings()) && app.dock) {
    app.dock.show()
  }
}

function isMainWindowOpen(): boolean {
  return !!(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible())
}

function hideMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  flushPendingWindowStateSave(mainWindow, WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)
  mainWindow.hide()
  const dockSettings = loadDockSettings()
  if (dockSettings.hidden && app.dock) {
    app.dock.hide()
  }
}

function showExistingMainWindow(notify?: () => void): void {
  if (!mainWindow || mainWindow.isDestroyed()) return

  applyWindowState(
    mainWindow,
    getCachedWindowState(WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT),
    WINDOW_MIN_WIDTH,
    WINDOW_MIN_HEIGHT
  )

  if (mainWindow.isMinimized()) mainWindow.restore()
  if (!mainWindow.isVisible()) mainWindow.show()
  mainWindow.focus()
  showDockIfNeeded()
  notify?.()
}

/** 全局快捷键「打开」：窗口已显示则隐藏，否则显示并进入密码库搜索 */
function toggleMainWindowForShortcut(): void {
  if (isMainWindowOpen()) {
    hideMainWindow()
    return
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    showExistingMainWindow(() => {
      mainWindow?.webContents.send('shortcut:open')
    })
    return
  }

  createWindow(true)
}

/** 聚焦或创建主窗口（托盘等始终显示） */
function focusMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    showExistingMainWindow(() => {
      mainWindow?.webContents.send('shortcut:open')
    })
    return
  }

  createWindow(true)
}

function sendTrayAction(action: TrayClickAction, notifyOpenOnLoad = false): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    showExistingMainWindow(() => {
      mainWindow?.webContents.send('tray:action', action)
    })
    return
  }

  createWindow(notifyOpenOnLoad)
  mainWindow?.webContents.once('did-finish-load', () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send('tray:action', action)
    }
  })
}

function syncTrayFromSettings(settings = loadTraySettings()): void {
  applyTraySettings(
    settings,
    {
      onOpen: () => focusMainWindow(),
      onQuickSearch: () => sendTrayAction('quick-search')
    },
    getIconBaseDir
  )
}

/** 注册全局快捷键 IPC */
function registerShortcutIpc(): void {
  ipcMain.handle('shortcut:sync', (_event, bindings: ShortcutBindings) => {
    try {
      const plain: ShortcutBindings = {
        open: bindings?.open ?? null,
        lock: bindings?.lock ?? null
      }
      return syncGlobalShortcuts(plain, toggleMainWindowForShortcut)
    } catch (error) {
      console.error('[shortcut:sync]', error)
      return {
        ok: false,
        failed: { open: '快捷键同步异常，请重启应用后重试' },
        status: getShortcutRegistrationStatus()
      }
    }
  })

  ipcMain.handle('shortcut:getStatus', () => getShortcutRegistrationStatus())
}

/** 注册开机自启 IPC */
function registerLaunchAtLoginIpc(): void {
  ipcMain.handle('launch-at-login:get', () => getLaunchAtLoginSettings())

  ipcMain.handle('launch-at-login:set', (_event, enabled: unknown) => {
    try {
      return {
        ok: true as const,
        settings: setLaunchAtLogin(enabled === true)
      }
    } catch (error) {
      console.error('[launch-at-login:set]', error)
      return {
        ok: false as const,
        error: '无法更新开机自启设置，请稍后重试'
      }
    }
  })
}

/** 注册状态栏图标 IPC */
function registerTrayIpc(): void {
  ipcMain.handle('tray:get', () => ({
    available: isTrayAvailable(),
    ...loadTraySettings()
  }))

  ipcMain.handle('tray:set', (_event, partial: Partial<TraySettings>) => {
    try {
      const current = loadTraySettings()
      const next = saveTraySettings({
        enabled: partial.enabled ?? current.enabled,
        clickAction: partial.clickAction ?? current.clickAction
      })
      syncTrayFromSettings(next)
      return {
        ok: true as const,
        settings: {
          available: isTrayAvailable(),
          ...next
        }
      }
    } catch (error) {
      console.error('[tray:set]', error)
      return {
        ok: false as const,
        error: '无法更新状态栏图标设置，请稍后重试'
      }
    }
  })
}

/** 注册 Dock 栏图标 IPC */
function registerDockIpc(): void {
  ipcMain.handle('dock:get', () => ({
    available: isDockIconAvailable(),
    ...loadDockSettings()
  }))

  ipcMain.handle('dock:set', (_event, hidden: unknown) => {
    try {
      const next = saveDockSettings({ hidden: hidden === true })
      applyDockIconVisibility(next)
      return {
        ok: true as const,
        settings: {
          available: isDockIconAvailable(),
          ...next
        }
      }
    } catch (error) {
      console.error('[dock:set]', error)
      return {
        ok: false as const,
        error: '无法更新 Dock 栏设置，请稍后重试'
      }
    }
  })
}

app.whenReady().then(() => {
  applyAppIcon()
  registerWindowIpc()
  registerThemeIpc()
  registerShortcutIpc()
  registerLaunchAtLoginIpc()
  registerTrayIpc()
  registerDockIpc()

  const initialBindings = loadShortcutBindings()
  syncGlobalShortcuts(initialBindings, toggleMainWindowForShortcut)

  applyDockIconVisibility(loadDockSettings())
  createWindow()
  syncTrayFromSettings()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  flushPendingWindowStateSave(mainWindow, WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)
  destroyTray()
  unregisterAllGlobalShortcuts()
})
