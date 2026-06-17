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
  focus: (): Promise<boolean> => ipcRenderer.invoke('window:focus'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('window:getPlatform'),
  onFocused: (callback: () => void): (() => void) => {
    const handler = (): void => callback()
    ipcRenderer.on('window:focused', handler)
    return () => ipcRenderer.removeListener('window:focused', handler)
  }
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
      clickAction: 'vault' | 'favorites' | 'recent' | 'settings'
    }>,
  setSettings: (partial: {
    enabled?: boolean
    clickAction?: 'vault' | 'favorites' | 'recent' | 'settings'
  }) =>
    ipcRenderer.invoke('tray:set', partial) as Promise<
      | {
          ok: true
          settings: {
            available: boolean
            enabled: boolean
            clickAction: 'vault' | 'favorites' | 'recent' | 'settings'
          }
        }
      | { ok: false; error: string }
    >,
  syncAppearance: (snapshot: unknown) =>
    ipcRenderer.invoke('tray:syncAppearance', snapshot) as Promise<{ ok: boolean }>,
  onAction: (callback: (action: 'vault' | 'favorites' | 'recent' | 'settings') => void): (() => void) => {
    const handler = (_event: unknown, action: 'vault' | 'favorites' | 'recent' | 'settings'): void => {
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

const vaultPasswordApi = {
  isAvailable: (): Promise<boolean> => ipcRenderer.invoke('vault-password:isAvailable'),
  get: (): Promise<string | null> => ipcRenderer.invoke('vault-password:get'),
  set: (password: string): Promise<{ ok: true } | { ok: false; error: string }> =>
    ipcRenderer.invoke('vault-password:set', password),
  remove: (): Promise<void> => ipcRenderer.invoke('vault-password:remove')
}

contextBridge.exposeInMainWorld('vaultPasswordApi', vaultPasswordApi)

const biometricApi = {
  getAvailability: (): Promise<{ available: boolean; kind: 'touchId' | 'windowsHello' | null }> =>
    ipcRenderer.invoke('biometric:getAvailability'),
  prompt: (reason: string): Promise<{ ok: true } | { ok: false; canceled: boolean; error?: string }> =>
    ipcRenderer.invoke('biometric:prompt', reason)
}

contextBridge.exposeInMainWorld('biometricApi', biometricApi)

const extensionBridgeApi = {
  onRequest: (
    callback: (payload: { id: string; method: string; params: unknown }) => void
  ): (() => void) => {
    const handler = (
      _event: unknown,
      payload: { id: string; method: string; params: unknown }
    ): void => {
      callback(payload)
    }
    ipcRenderer.on('extension-bridge:request', handler)
    return () => ipcRenderer.removeListener('extension-bridge:request', handler)
  },
  sendResponse: (id: string, result: { ok: boolean; data?: unknown; error?: string }): void => {
    ipcRenderer.send('extension-bridge:response', id, result)
  }
}

contextBridge.exposeInMainWorld('extensionBridgeApi', extensionBridgeApi)

const offlineVaultApi = {
  getDefaultDataDir: () => ipcRenderer.invoke('offline-vault:getDefaultDataDir') as Promise<string>,
  getSettings: () =>
    ipcRenderer.invoke('offline-vault:getSettings') as Promise<{
      enabled: boolean
      dataDir: string
    }>,
  setSettings: (partial: { enabled?: boolean; dataDir?: string }) =>
    ipcRenderer.invoke('offline-vault:setSettings', partial) as Promise<
      | { ok: true; settings: { enabled: boolean; dataDir: string } }
      | { ok: false; error: string }
    >,
  pickDataDir: (currentDir?: string) =>
    ipcRenderer.invoke('offline-vault:pickDataDir', currentDir ?? null) as Promise<string | null>,
  readSnapshot: () => ipcRenderer.invoke('offline-vault:readSnapshot') as Promise<unknown>,
  importSnapshot: (snapshot: unknown) =>
    ipcRenderer.invoke('offline-vault:importSnapshot', snapshot) as Promise<
      | { ok: true; snapshot: unknown }
      | { ok: false; error: string }
    >,
  listEntries: () => ipcRenderer.invoke('offline-vault:listEntries') as Promise<unknown[]>,
  createEntry: (entry: unknown) =>
    ipcRenderer.invoke('offline-vault:createEntry', entry) as Promise<
      | { ok: true; entry: unknown }
      | { ok: false; error: string }
    >,
  updateEntry: (id: number, entry: unknown) =>
    ipcRenderer.invoke('offline-vault:updateEntry', id, entry) as Promise<
      | { ok: true; entry: unknown }
      | { ok: false; error: string }
    >,
  updateEntryRaw: (id: number, entry: unknown) =>
    ipcRenderer.invoke('offline-vault:updateEntryRaw', id, entry) as Promise<
      | { ok: true; entry: unknown }
      | { ok: false; error: string }
    >,
  deleteEntry: (id: number) =>
    ipcRenderer.invoke('offline-vault:deleteEntry', id) as Promise<
      | { ok: true; deleted: boolean }
      | { ok: false; error: string }
    >,
  getFavoritesMeta: () => ipcRenderer.invoke('offline-vault:getFavoritesMeta') as Promise<unknown[]>,
  getFavoriteIds: () => ipcRenderer.invoke('offline-vault:getFavoriteIds') as Promise<number[]>,
  addFavorite: (passwordId: number) =>
    ipcRenderer.invoke('offline-vault:addFavorite', passwordId) as Promise<
      | { ok: true }
      | { ok: false; error: string }
    >,
  removeFavorite: (passwordId: number) =>
    ipcRenderer.invoke('offline-vault:removeFavorite', passwordId) as Promise<
      | { ok: true }
      | { ok: false; error: string }
    >,
  getRecentMeta: () => ipcRenderer.invoke('offline-vault:getRecentMeta') as Promise<unknown[]>,
  recordRecent: (passwordId: number) =>
    ipcRenderer.invoke('offline-vault:recordRecent', passwordId) as Promise<
      | { ok: true }
      | { ok: false; error: string }
    >
}

contextBridge.exposeInMainWorld('offlineVaultApi', offlineVaultApi)
