import type { ExtensionSession } from '@/shared/types'
import { getDefaultServerOrigin } from '@/shared/utils/serverUrl'

const STORAGE_KEY = 'bear_extension_session'
const SERVER_KEY = 'bear_extension_server'

export async function loadSession(): Promise<ExtensionSession | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return normalizeSession(result[STORAGE_KEY])
}

export async function saveSession(session: ExtensionSession): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: session })
}

export async function clearSession(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
}

export async function loadServerOrigin(): Promise<string> {
  const result = await chrome.storage.local.get(SERVER_KEY)
  return (result[SERVER_KEY] as string | undefined) ?? getDefaultServerOrigin()
}

export async function saveServerOrigin(origin: string): Promise<void> {
  await chrome.storage.local.set({ [SERVER_KEY]: origin })
}

export function createEmptySession(serverOrigin: string): ExtensionSession {
  return {
    token: '',
    username: '',
    serverOrigin,
    securityKey: null,
    vukBase64: null
  }
}

/** 兼容旧版会话数据，去除 locked 字段 */
export function normalizeSession(raw: unknown): ExtensionSession | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>
  if (!record.token || typeof record.token !== 'string') return null
  return {
    token: record.token,
    username: String(record.username ?? ''),
    avatar: record.avatar ? String(record.avatar) : undefined,
    serverOrigin: String(record.serverOrigin ?? getDefaultServerOrigin()),
    securityKey: record.securityKey ? String(record.securityKey) : null,
    vukBase64: record.vukBase64 ? String(record.vukBase64) : null
  }
}
