import { app, BrowserWindow, dialog, ipcMain, nativeImage, nativeTheme, shell } from 'electron'
import { randomUUID } from 'node:crypto'
import { writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { basename, join } from 'path'
import {
  syncGlobalShortcuts,
  unregisterAllGlobalShortcuts,
  attachFocusedShortcutListener,
  getShortcutRegistrationStatus,
  type ShortcutBindings
} from './shortcuts'
import { loadShortcutBindings } from './shortcutConfig'
import { getLaunchAtLoginSettings, setLaunchAtLogin } from './launchAtLogin'
import type { TraySettings } from '../../shared/traySettings'
import type { TrayAppearanceSnapshot, TrayRendererCommand } from '../../shared/trayMenu'
import { loadTraySettings, saveTraySettings } from './trayConfig'
import { applyTraySettings, destroyTray, isTrayAvailable } from './tray'
import { saveTrayAppearanceSnapshot } from './trayAppearance'
import { loadDockSettings, saveDockSettings } from './dockConfig'
import { applyDockIconVisibility, isDockIconAvailable, shouldShowDockOnFocus } from './dock'
import {
  getBiometricAvailability,
  promptBiometricUnlock
} from './biometricAuth'
import {
  isSecurityKeyEncryptionAvailable,
  loadStoredSecurityKey,
  removeStoredSecurityKey,
  saveStoredSecurityKey
} from './securityKeyStorage'
import {
  isVaultPasswordEncryptionAvailable,
  loadStoredVaultPassword,
  removeStoredVaultPassword,
  saveStoredVaultPassword
} from './vaultPasswordStorage'
import {
  applyWindowState,
  attachMainWindowStateListeners,
  flushPendingWindowStateSave,
  getCachedWindowState,
  persistMainWindowState,
  seedCachedWindowState
} from './windowState'
import {
  setExtensionBridgeFocusHandler,
  setExtensionBridgeInvoker,
  startExtensionBridgeServer,
  stopExtensionBridgeServer
} from './extensionBridgeServer'
import type { ExtensionBridgeMethod } from '../../shared/extensionBridge'
import { registerOfflineVaultIpc } from './offlineVaultIpc'

/** dev 与生产环境统一 userData 目录（~/Library/Application Support/BearPassword） */
app.setName('BearPassword')

const DESKTOP_WAKE_PROTOCOL = 'bearpassword'
let pendingWakeUrl: string | null = null

function registerDesktopWakeProtocol(): void {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(DESKTOP_WAKE_PROTOCOL, process.execPath, [join(process.argv[1])])
      return
    }
  }
  app.setAsDefaultProtocolClient(DESKTOP_WAKE_PROTOCOL)
}

function isDesktopWakeUrl(url: string): boolean {
  return url.startsWith(`${DESKTOP_WAKE_PROTOCOL}://`)
}

function handleDesktopWakeRequest(): void {
  if (app.isReady()) {
    focusMainWindow()
    return
  }
  app.whenReady().then(() => focusMainWindow())
}

function handleDesktopWakeUrl(url: string): void {
  if (!isDesktopWakeUrl(url)) return
  handleDesktopWakeRequest()
}

function findDesktopWakeUrl(argv: string[]): string | undefined {
  return argv.find((arg) => isDesktopWakeUrl(arg))
}

/** 主窗口实例引用，用于窗口控制 IPC */
let mainWindow: BrowserWindow | null = null

const pendingExtensionBridgeCalls = new Map<
  string,
  {
    resolve: (value: unknown) => void
    reject: (reason: Error) => void
    timer: NodeJS.Timeout
  }
>()

function invokeExtensionBridgeRenderer(
  method: ExtensionBridgeMethod,
  params: unknown
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      reject(new Error('桌面端窗口未就绪'))
      return
    }

    const id = randomUUID()
    const timer = setTimeout(() => {
      pendingExtensionBridgeCalls.delete(id)
      reject(new Error('桌面端处理超时'))
    }, 30_000)

    pendingExtensionBridgeCalls.set(id, {
      resolve: (value) => resolve(value),
      reject,
      timer
    })

    mainWindow!.webContents.send('extension-bridge:request', { id, method, params })
  })
}

function registerExtensionBridgeIpc(): void {
  ipcMain.on(
    'extension-bridge:response',
    (_event, id: string, result: { ok: boolean; data?: unknown; error?: string }) => {
      const pending = pendingExtensionBridgeCalls.get(id)
      if (!pending) return
      clearTimeout(pending.timer)
      pendingExtensionBridgeCalls.delete(id)
      if (result.ok) {
        pending.resolve(result.data)
        return
      }
      pending.reject(new Error(result.error || '桌面端处理失败'))
    }
  )
}

/** 正在退出应用，避免托盘模式下 close 事件拦截 quit */
let isQuitting = false

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

  mainWindow.on('focus', () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send('window:focused')
    }
  })

  // 启用托盘时，关闭窗口改为隐藏到托盘（生产环境）；开发环境直接退出，避免残留多个托盘图标
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    if (isDev) return
    if (!isTrayAvailable() || !loadTraySettings().enabled) return
    event.preventDefault()
    hideMainWindow()
  })

  // 窗口准备好后再显示，避免白屏闪烁
  mainWindow.on('ready-to-show', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return
    if (savedState.isMaximized) {
      mainWindow.maximize()
    }
    bringMainWindowToFront(mainWindow)
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

  ipcMain.handle('window:focus', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      bringMainWindowToFront(mainWindow)
      return true
    }
    return false
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

/** 将主窗口显示并置于最前，避免被其他应用遮挡 */
function bringMainWindowToFront(win: BrowserWindow): void {
  if (win.isDestroyed()) return

  if (win.isMinimized()) {
    win.restore()
  }
  if (!win.isVisible()) {
    win.show()
  }

  if (process.platform === 'darwin') {
    app.focus({ steal: true })
    win.moveTop()
  } else if (process.platform === 'win32') {
    win.setAlwaysOnTop(true)
    win.setAlwaysOnTop(false)
  }

  win.focus()
  showDockIfNeeded()
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

  bringMainWindowToFront(mainWindow)
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

function shouldFocusWindowForTrayCommand(command: TrayRendererCommand): boolean {
  return (
    command.action === 'open' ||
    command.action === 'settings' ||
    command.action === 'quick-search' ||
    command.action === 'vault' ||
    command.action === 'favorites' ||
    command.action === 'recent'
  )
}

function sendTrayCommand(command: TrayRendererCommand, notifyOpenOnLoad = false): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (shouldFocusWindowForTrayCommand(command)) {
      showExistingMainWindow(() => {
        mainWindow?.webContents.send('tray:command', command)
      })
      return
    }
    mainWindow.webContents.send('tray:command', command)
    return
  }

  createWindow(notifyOpenOnLoad || shouldFocusWindowForTrayCommand(command))
  mainWindow?.webContents.once('did-finish-load', () => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send('tray:command', command)
    }
  })
}

function quitApp(): void {
  if (isQuitting) return
  isQuitting = true
  destroyTray()
  unregisterAllGlobalShortcuts()
  app.quit()
}

function syncTrayFromSettings(settings = loadTraySettings()): void {
  applyTraySettings(
    settings,
    {
      onOpen: () => focusMainWindow(),
      onVault: () => sendTrayCommand({ action: 'vault' }),
      onFavorites: () => sendTrayCommand({ action: 'favorites' }),
      onRecent: () => sendTrayCommand({ action: 'recent' }),
      onLock: () => sendTrayCommand({ action: 'lock' }),
      onSettings: () => sendTrayCommand({ action: 'settings' }),
      onSetTheme: (value) => sendTrayCommand({ action: 'set-theme', value }),
      onSetLocale: (value) => sendTrayCommand({ action: 'set-locale', value }),
      onSetFont: (value) => sendTrayCommand({ action: 'set-font', value }),
      onQuit: () => quitApp()
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

  ipcMain.handle('tray:syncAppearance', (_event, snapshot: TrayAppearanceSnapshot) => {
    try {
      saveTrayAppearanceSnapshot(snapshot)
      return { ok: true as const }
    } catch (error) {
      console.error('[tray:syncAppearance]', error)
      return { ok: false as const }
    }
  })
}

/** 注册文件选择 IPC（密码 CSV 导入） */
function registerFileIpc(): void {
  ipcMain.handle('file:pickPasswordCsv', async () => {
    const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined
    const result = await dialog.showOpenDialog(parent, {
      title: '选择浏览器导出的密码 CSV 文件',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile']
    })

    if (result.canceled || !result.filePaths.length) {
      return null
    }

    const filePath = result.filePaths[0]
    const content = await readFile(filePath, 'utf-8')
    return {
      fileName: basename(filePath),
      content
    }
  })

  ipcMain.handle(
    'file:saveSecurityKeyBackup',
    async (_event, payload: { defaultFileName: string; content: string }) => {
      const parent = mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined
      const result = await dialog.showSaveDialog(parent, {
        title: '保存安全密钥备份',
        defaultPath: payload.defaultFileName,
        filters: [{ name: 'Text', extensions: ['txt'] }]
      })

      if (result.canceled || !result.filePath) {
        return { ok: false as const, canceled: true as const }
      }

      await writeFile(result.filePath, payload.content, 'utf-8')
      return { ok: true as const, filePath: result.filePath }
    }
  )
}

/** 注册生物识别解锁 IPC（Touch ID / Windows Hello） */
function registerBiometricIpc(): void {
  ipcMain.handle('biometric:getAvailability', async () => getBiometricAvailability())

  ipcMain.handle('biometric:prompt', async (_event, reason: unknown) => {
    const message = typeof reason === 'string' ? reason : ''
    return promptBiometricUnlock(message)
  })
}

/** 注册安全密钥存储 IPC（系统钥匙串 / 凭据管理器） */
function registerSecureStorageIpc(): void {
  ipcMain.handle('secure-storage:isAvailable', () => isSecurityKeyEncryptionAvailable())

  ipcMain.handle('secure-storage:get', async () => loadStoredSecurityKey())

  ipcMain.handle('secure-storage:set', async (_event, key: unknown) => {
    if (typeof key !== 'string') {
      return { ok: false as const, error: '安全密钥格式无效' }
    }
    return saveStoredSecurityKey(key)
  })

  ipcMain.handle('secure-storage:remove', async () => {
    await removeStoredSecurityKey()
  })
}

/** 注册主密码存储 IPC（生物识别解锁保险库时使用，与登录密码分离） */
function registerVaultPasswordIpc(): void {
  ipcMain.handle('vault-password:isAvailable', () => isVaultPasswordEncryptionAvailable())

  ipcMain.handle('vault-password:get', async () => loadStoredVaultPassword())

  ipcMain.handle('vault-password:set', async (_event, password: unknown) => {
    if (typeof password !== 'string') {
      return { ok: false as const, error: '密码格式无效' }
    }
    return saveStoredVaultPassword(password)
  })

  ipcMain.handle('vault-password:remove', async () => {
    await removeStoredVaultPassword()
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

function registerAppLifecycleHandlers(): void {
  app.on('activate', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      bringMainWindowToFront(mainWindow)
      return
    }
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.on('window-all-closed', () => {
    if (isDev) {
      quitApp()
      return
    }
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    isQuitting = true
    destroyTray()
    unregisterAllGlobalShortcuts()
  })

  app.on('will-quit', () => {
    flushPendingWindowStateSave(mainWindow, WINDOW_MIN_WIDTH, WINDOW_MIN_HEIGHT)
    stopExtensionBridgeServer()
  })

  if (isDev) {
    const handleDevExitSignal = (): void => {
      quitApp()
    }
    process.on('SIGINT', handleDevExitSignal)
    process.on('SIGTERM', handleDevExitSignal)
  }
}

function startApp(): void {
  app.whenReady().then(() => {
    applyAppIcon()
    registerWindowIpc()
    registerThemeIpc()
    registerShortcutIpc()
    registerLaunchAtLoginIpc()
    registerTrayIpc()
    registerDockIpc()
    registerFileIpc()
    registerOfflineVaultIpc(() => mainWindow)
    registerSecureStorageIpc()
    registerVaultPasswordIpc()
    registerBiometricIpc()
    registerExtensionBridgeIpc()
    setExtensionBridgeInvoker(invokeExtensionBridgeRenderer)
    setExtensionBridgeFocusHandler(focusMainWindow)
    startExtensionBridgeServer()
    registerAppLifecycleHandlers()

    const initialBindings = loadShortcutBindings()
    syncGlobalShortcuts(initialBindings, toggleMainWindowForShortcut)

    applyDockIconVisibility(loadDockSettings())
    createWindow()
    syncTrayFromSettings()

    if (pendingWakeUrl) {
      handleDesktopWakeUrl(pendingWakeUrl)
      pendingWakeUrl = null
      return
    }

    const launchWakeUrl = findDesktopWakeUrl(process.argv)
    if (launchWakeUrl) {
      handleDesktopWakeUrl(launchWakeUrl)
    }
  })
}

registerDesktopWakeProtocol()

app.on('open-url', (event, url) => {
  event.preventDefault()
  if (!isDesktopWakeUrl(url)) return
  if (app.isReady()) {
    handleDesktopWakeUrl(url)
    return
  }
  pendingWakeUrl = url
})

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const wakeUrl = findDesktopWakeUrl(argv)
    if (wakeUrl) {
      handleDesktopWakeUrl(wakeUrl)
      return
    }
    focusMainWindow()
  })
  startApp()
}
