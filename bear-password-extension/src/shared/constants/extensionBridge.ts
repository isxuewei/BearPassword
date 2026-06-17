export const EXTENSION_BRIDGE_HOST = '127.0.0.1'
export const EXTENSION_BRIDGE_PORT = 6892
export const EXTENSION_BRIDGE_ORIGIN = `http://${EXTENSION_BRIDGE_HOST}:${EXTENSION_BRIDGE_PORT}`

export const DESKTOP_WAKE_PROTOCOL_URL = 'bearpassword://focus'

export interface ExtensionBridgeHealth {
  ready: boolean
  loggedIn: boolean
  unlocked: boolean
  locked: boolean
  username: string | null
  themePreference: string | null
  localePreference: string | null
}
