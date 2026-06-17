/** 浏览器扩展 ↔ 桌面端本地桥接（固定端口） */
export const EXTENSION_BRIDGE_HOST = '127.0.0.1'
export const EXTENSION_BRIDGE_PORT = 6892
export const EXTENSION_BRIDGE_ORIGIN = `http://${EXTENSION_BRIDGE_HOST}:${EXTENSION_BRIDGE_PORT}`

/** 扩展唤起桌面端（未连接时由系统打开应用） */
export const DESKTOP_WAKE_PROTOCOL_URL = 'bearpassword://focus'

export interface ExtensionBridgeHealth {
  ready: boolean
  loggedIn: boolean
  unlocked: boolean
  locked: boolean
  username: string | null
  /** 桌面端主题偏好；桥接不可用时为 null */
  themePreference: string | null
  /** 桌面端语言偏好；桥接不可用时为 null */
  localePreference: string | null
}

export type ExtensionBridgeMethod =
  | 'health'
  | 'matchCredentials'
  | 'getCredential'
  | 'createCredential'
  | 'updateCredential'
  | 'deleteCredential'
  | 'toggleFavorite'

export interface ExtensionBridgeCallPayload {
  id: string
  method: ExtensionBridgeMethod
  params: unknown
}

export interface ExtensionBridgeCallResult {
  ok: boolean
  data?: unknown
  error?: string
}
