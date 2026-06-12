import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import {
  buildDesktopUpdateFeedUrl,
  type DesktopUpdatePhase,
  type DesktopUpdateStatus
} from '../../shared/updater'

let feedOrigin = (process.env.VITE_SERVER_URL || 'https://bear-password.xuewei.fun').replace(
  /\/+$/,
  ''
)

let phase: DesktopUpdatePhase = 'idle'
let latestVersion: string | null = null
let downloadPercent = 0
let statusMessage: string | null = null
let onBeforeQuitInstall: (() => void) | null = null

function isSupported(): boolean {
  return app.isPackaged
}

function broadcastStatus(win: BrowserWindow | null): void {
  if (!win || win.isDestroyed()) return
  win.webContents.send('updater:status', getStatus())
}

function setPhase(
  next: DesktopUpdatePhase,
  win: BrowserWindow | null,
  options?: { version?: string | null; percent?: number; message?: string | null }
): void {
  phase = next
  if (options?.version !== undefined) latestVersion = options.version
  if (options?.percent !== undefined) downloadPercent = options.percent
  if (options?.message !== undefined) statusMessage = options.message
  broadcastStatus(win)
}

function configureFeed(): void {
  if (!isSupported()) return

  autoUpdater.setFeedURL({
    provider: 'generic',
    url: buildDesktopUpdateFeedUrl(feedOrigin, process.platform)
  })
}

export function setUpdateFeedOrigin(origin: string, win: BrowserWindow | null): void {
  const normalized = origin.trim().replace(/\/+$/, '')
  if (!normalized || feedOrigin === normalized) return
  feedOrigin = normalized
  configureFeed()
  if (phase === 'idle' || phase === 'error') {
    void checkForUpdates(win)
  }
}

export function getStatus(): DesktopUpdateStatus {
  return {
    supported: isSupported(),
    phase,
    version: latestVersion,
    percent: downloadPercent,
    message: statusMessage
  }
}

export async function checkForUpdates(win: BrowserWindow | null): Promise<DesktopUpdateStatus> {
  if (!isSupported()) {
    return getStatus()
  }

  configureFeed()
  setPhase('checking', win, { message: null })
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    const message = error instanceof Error ? error.message : '检查更新失败'
    setPhase('error', win, { message })
  }
  return getStatus()
}

export function initDesktopUpdater(
  getMainWindow: () => BrowserWindow | null,
  beforeQuitInstall: () => void
): void {
  onBeforeQuitInstall = beforeQuitInstall

  if (!isSupported()) {
    registerUpdaterIpc(getMainWindow)
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = false
  autoUpdater.allowDowngrade = false

  autoUpdater.on('checking-for-update', () => {
    setPhase('checking', getMainWindow(), { message: null })
  })

  autoUpdater.on('update-available', (info) => {
    setPhase('available', getMainWindow(), {
      version: info.version ?? null,
      percent: 0,
      message: null
    })
  })

  autoUpdater.on('update-not-available', () => {
    setPhase('idle', getMainWindow(), {
      version: null,
      percent: 0,
      message: null
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    setPhase('downloading', getMainWindow(), {
      percent: Math.round(progress.percent),
      message: null
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    setPhase('ready', getMainWindow(), {
      version: info.version ?? latestVersion,
      percent: 100,
      message: null
    })
  })

  autoUpdater.on('error', (error) => {
    const message = error instanceof Error ? error.message : String(error)
    setPhase('error', getMainWindow(), { message })
  })

  registerUpdaterIpc(getMainWindow)
  configureFeed()

  setTimeout(() => {
    void checkForUpdates(getMainWindow())
  }, 4000)
}

function registerUpdaterIpc(getMainWindow: () => BrowserWindow | null): void {
  ipcMain.handle('updater:getStatus', () => getStatus())
  ipcMain.handle('updater:isSupported', () => isSupported())
  ipcMain.handle('updater:setFeedOrigin', (_event, origin: unknown) => {
    if (typeof origin !== 'string' || !origin.trim()) return getStatus()
    setUpdateFeedOrigin(origin, getMainWindow())
    return getStatus()
  })
  ipcMain.handle('updater:check', async () => checkForUpdates(getMainWindow()))
  ipcMain.handle('updater:quitAndInstall', () => {
    if (!isSupported() || phase !== 'ready') {
      return { ok: false as const }
    }
    onBeforeQuitInstall?.()
    autoUpdater.quitAndInstall()
    return { ok: true as const }
  })
}
