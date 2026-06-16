import { contextBridge, ipcRenderer } from 'electron'

/**
 * 窗口控制 API — 通过 contextBridge 安全暴露给渲染进程
 * 渲染进程通过 window.windowApi 调用
 */
const windowApi = {
  minimize: (): void => ipcRenderer.send('window:minimize'),
  maximize: (): void => ipcRenderer.send('window:maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  hide: (): void => ipcRenderer.send('window:hide'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('window:getPlatform')
}

const themeApi = {
  getShouldUseDarkColors: (): Promise<boolean> => ipcRenderer.invoke('theme:shouldUseDarkColors'),
  onUpdated: (callback: (shouldUseDarkColors: boolean) => void): (() => void) => {
    const handler = (_event: unknown, shouldUseDarkColors: boolean): void => {
      callback(shouldUseDarkColors)
    }
    ipcRenderer.on('theme:updated', handler)
    return () => ipcRenderer.removeListener('theme:updated', handler)
  }
}

contextBridge.exposeInMainWorld('windowApi', windowApi)
contextBridge.exposeInMainWorld('themeApi', themeApi)

const shortcutApi = {
  sync: (bindings: { open: string | null; lock: string | null }) =>
    ipcRenderer.invoke('shortcut:sync', bindings) as Promise<{
      ok: boolean
      failed?: Partial<Record<'open' | 'lock', string>>
      status?: {
        open: { enabled: boolean; registered: boolean }
        lock: { enabled: boolean; registered: boolean }
      }
    }>,
  getStatus: () =>
    ipcRenderer.invoke('shortcut:getStatus') as Promise<{
      open: { enabled: boolean; registered: boolean }
      lock: { enabled: boolean; registered: boolean }
    }>,
  onLock: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('shortcut:lock', handler)
    return () => ipcRenderer.removeListener('shortcut:lock', handler)
  },
  onOpen: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('shortcut:open', handler)
    return () => ipcRenderer.removeListener('shortcut:open', handler)
  }
}

contextBridge.exposeInMainWorld('shortcutApi', shortcutApi)

const launchAtLoginApi = {
  getSettings: () =>
    ipcRenderer.invoke('launch-at-login:get') as Promise<{
      available: boolean
      enabled: boolean
    }>,
  setEnabled: (enabled: boolean) =>
    ipcRenderer.invoke('launch-at-login:set', enabled) as Promise<
      | { ok: true; settings: { available: boolean; enabled: boolean } }
      | { ok: false; error: string }
    >
}

contextBridge.exposeInMainWorld('launchAtLoginApi', launchAtLoginApi)

const trayApi = {
  getSettings: () =>
    ipcRenderer.invoke('tray:get') as Promise<{
      available: boolean
      enabled: boolean
      clickAction: 'open' | 'quick-search'
    }>,
  setSettings: (partial: {
    enabled?: boolean
    clickAction?: 'open' | 'quick-search'
  }) =>
    ipcRenderer.invoke('tray:set', partial) as Promise<
      | {
          ok: true
          settings: {
            available: boolean
            enabled: boolean
            clickAction: 'open' | 'quick-search'
          }
        }
      | { ok: false; error: string }
    >,
  syncAppearance: (snapshot: unknown) =>
    ipcRenderer.invoke('tray:syncAppearance', snapshot) as Promise<{ ok: boolean }>,
  onAction: (callback: (action: 'open' | 'quick-search') => void): (() => void) => {
    const handler = (_event: unknown, action: 'open' | 'quick-search'): void => {
      callback(action)
    }
    ipcRenderer.on('tray:action', handler)
    return () => ipcRenderer.removeListener('tray:action', handler)
  },
  onCommand: (callback: (command: unknown) => void): (() => void) => {
    const handler = (_event: unknown, command: unknown): void => {
      callback(command)
    }
    ipcRenderer.on('tray:command', handler)
    return () => ipcRenderer.removeListener('tray:command', handler)
  }
}

contextBridge.exposeInMainWorld('trayApi', trayApi)

const dockApi = {
  getSettings: () =>
    ipcRenderer.invoke('dock:get') as Promise<{
      available: boolean
      hidden: boolean
    }>,
  setHidden: (hidden: boolean) =>
    ipcRenderer.invoke('dock:set', hidden) as Promise<
      | { ok: true; settings: { available: boolean; hidden: boolean } }
      | { ok: false; error: string }
    >
}

contextBridge.exposeInMainWorld('dockApi', dockApi)

const fileApi = {
  pickPasswordCsv: () =>
    ipcRenderer.invoke('file:pickPasswordCsv') as Promise<{
      fileName: string
      content: string
    } | null>,
  saveSecurityKeyBackup: (payload: { defaultFileName: string; content: string }) =>
    ipcRenderer.invoke('file:saveSecurityKeyBackup', payload) as Promise<
      { ok: true; filePath: string } | { ok: false; canceled: true }
    >
}

contextBridge.exposeInMainWorld('fileApi', fileApi)

const secureStorageApi = {
  isAvailable: (): Promise<boolean> => ipcRenderer.invoke('secure-storage:isAvailable'),
  get: (): Promise<string | null> => ipcRenderer.invoke('secure-storage:get'),
  set: (key: string): Promise<{ ok: true } | { ok: false; error: string }> =>
    ipcRenderer.invoke('secure-storage:set', key),
  remove: (): Promise<void> => ipcRenderer.invoke('secure-storage:remove')
}

contextBridge.exposeInMainWorld('secureStorageApi', secureStorageApi)

const accountPasswordApi = {
  isAvailable: (): Promise<boolean> => ipcRenderer.invoke('account-password:isAvailable'),
  get: (): Promise<string | null> => ipcRenderer.invoke('account-password:get'),
  set: (password: string): Promise<{ ok: true } | { ok: false; error: string }> =>
    ipcRenderer.invoke('account-password:set', password),
  remove: (): Promise<void> => ipcRenderer.invoke('account-password:remove')
}

contextBridge.exposeInMainWorld('accountPasswordApi', accountPasswordApi)

const biometricApi = {
  getAvailability: (): Promise<{ available: boolean; kind: 'touchId' | 'windowsHello' | null }> =>
    ipcRenderer.invoke('biometric:getAvailability'),
  prompt: (reason: string): Promise<{ ok: true } | { ok: false; canceled: boolean; error?: string }> =>
    ipcRenderer.invoke('biometric:prompt', reason)
}

contextBridge.exposeInMainWorld('biometricApi', biometricApi)
