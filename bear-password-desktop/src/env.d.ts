/// <reference types="vite/client" />

/** Vue 单文件组件类型声明 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

/** Electron preload 暴露的窗口控制 API */
interface WindowApi {
  minimize: () => void
  maximize: () => void
  close: () => void
  hide: () => void
  isMaximized: () => Promise<boolean>
  getPlatform: () => Promise<NodeJS.Platform>
}

/** Electron preload 暴露的系统主题 API */
interface ThemeApi {
  getShouldUseDarkColors: () => Promise<boolean>
  onUpdated: (callback: (shouldUseDarkColors: boolean) => void) => () => void
}

/** Electron preload 暴露的全局快捷键 API */
interface ShortcutApi {
  sync: (bindings: { open: string | null; lock: string | null }) => Promise<{
    ok: boolean
    failed?: Partial<Record<'open' | 'lock', string>>
    status?: ShortcutRegistrationStatus
  }>
  getStatus: () => Promise<ShortcutRegistrationStatus>
  onLock: (callback: () => void) => () => void
  onOpen: (callback: () => void) => () => void
}

interface ShortcutRegistrationStatus {
  open: { enabled: boolean; registered: boolean }
  lock: { enabled: boolean; registered: boolean }
}

interface LaunchAtLoginSettings {
  available: boolean
  enabled: boolean
}

/** Electron preload 暴露的开机自启 API */
interface LaunchAtLoginApi {
  getSettings: () => Promise<LaunchAtLoginSettings>
  setEnabled: (enabled: boolean) => Promise<
    | { ok: true; settings: LaunchAtLoginSettings }
    | { ok: false; error: string }
  >
}

interface TraySettingsState {
  available: boolean
  enabled: boolean
  clickAction: TrayClickAction
}

interface TrayAppearanceSnapshot {
  theme: string
  locale: string
  font: string
  labels: Record<string, unknown>
}

type TrayRendererCommand =
  | { action: 'open' }
  | { action: 'lock' }
  | { action: 'settings' }
  | { action: 'quick-search' }
  | { action: 'set-theme'; value: string }
  | { action: 'set-locale'; value: string }
  | { action: 'set-font'; value: string }

/** Electron preload 暴露的状态栏图标 API */
interface TrayApi {
  getSettings: () => Promise<TraySettingsState>
  setSettings: (partial: Partial<Pick<TraySettingsState, 'enabled' | 'clickAction'>>) => Promise<
    | { ok: true; settings: TraySettingsState }
    | { ok: false; error: string }
  >
  syncAppearance: (snapshot: TrayAppearanceSnapshot) => Promise<{ ok: boolean }>
  onAction: (callback: (action: TrayClickAction) => void) => () => void
  onCommand: (callback: (command: TrayRendererCommand) => void) => () => void
}

type TrayClickAction = 'open' | 'quick-search'

interface DockSettingsState {
  available: boolean
  hidden: boolean
}

/** Electron preload 暴露的 Dock 栏 API */
interface DockApi {
  getSettings: () => Promise<DockSettingsState>
  setHidden: (hidden: boolean) => Promise<
    | { ok: true; settings: DockSettingsState }
    | { ok: false; error: string }
  >
}

/** Electron preload 暴露的文件选择 API */
interface FileApi {
  pickPasswordCsv: () => Promise<{ fileName: string; content: string } | null>
  saveSecurityKeyBackup: (payload: {
    defaultFileName: string
    content: string
  }) => Promise<{ ok: true; filePath: string } | { ok: false; canceled: true }>
}

/** Electron preload 暴露的安全密钥存储 API（系统钥匙串） */
interface SecureStorageApi {
  isAvailable: () => Promise<boolean>
  get: () => Promise<string | null>
  set: (key: string) => Promise<{ ok: true } | { ok: false; error: string }>
  remove: () => Promise<void>
}

/** Electron preload 暴露的账户密码存储 API（生物识别解锁时替代手动输入） */
interface AccountPasswordApi {
  isAvailable: () => Promise<boolean>
  get: () => Promise<string | null>
  set: (password: string) => Promise<{ ok: true } | { ok: false; error: string }>
  remove: () => Promise<void>
}

/** Electron preload 暴露的生物识别解锁 API */
interface BiometricApi {
  getAvailability: () => Promise<{
    available: boolean
    kind: 'touchId' | 'windowsHello' | null
  }>
  prompt: (reason: string) => Promise<
    | { ok: true }
    | { ok: false; canceled: boolean; error?: string }
  >
}

declare global {
  interface Window {
    windowApi?: WindowApi
    themeApi?: ThemeApi
    shortcutApi?: ShortcutApi
    launchAtLoginApi?: LaunchAtLoginApi
    trayApi?: TrayApi
    dockApi?: DockApi
    fileApi?: FileApi
    secureStorageApi?: SecureStorageApi
    accountPasswordApi?: AccountPasswordApi
    biometricApi?: BiometricApi
  }
}

export {}
