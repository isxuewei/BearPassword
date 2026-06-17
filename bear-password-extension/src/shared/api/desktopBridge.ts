import {
  EXTENSION_BRIDGE_ORIGIN,
  type ExtensionBridgeHealth
} from '@/shared/constants/extensionBridge'
import {
  getWakeFallbackPageUrl,
  isWakeableWebTabUrl,
  triggerProtocolOnTab,
  type WakeDesktopResult
} from '@/shared/utils/desktopProtocol'
import type {
  FillCredential,
  MatchingCredentialsResult,
  SaveCredentialPayload,
  UpdateCredentialPayload,
  UpsertCredentialPayload,
  WebsiteMatchMode
} from '@/shared/types'

interface BridgeEnvelope<T> {
  code: number
  message: string
  data: T
}

class DesktopBridgeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DesktopBridgeError'
  }
}

async function bridgeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${EXTENSION_BRIDGE_ORIGIN}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {})
    }
  })

  let payload: BridgeEnvelope<T> | null = null
  try {
    payload = (await response.json()) as BridgeEnvelope<T>
  } catch {
    if (!response.ok) {
      throw new DesktopBridgeError('无法连接 BearPassword 桌面端')
    }
  }

  if (!response.ok || !payload || (payload.code !== 0 && payload.code !== 200)) {
    throw new DesktopBridgeError(payload?.message || '桌面端请求失败')
  }

  return payload.data
}

export async function getDesktopHealthApi(): Promise<ExtensionBridgeHealth> {
  return bridgeFetch<ExtensionBridgeHealth>('/health')
}

export async function probeDesktopBridge(): Promise<ExtensionBridgeHealth> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(`${EXTENSION_BRIDGE_ORIGIN}/health`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    })
    const payload = (await response.json()) as BridgeEnvelope<ExtensionBridgeHealth>
    if (!response.ok || (payload.code !== 0 && payload.code !== 200)) {
      throw new DesktopBridgeError(payload.message || '桌面端未就绪')
    }
    return payload.data
  } catch (err) {
    if (err instanceof DesktopBridgeError) throw err
    throw new DesktopBridgeError('无法连接 BearPassword 桌面端，请先启动桌面应用')
  } finally {
    clearTimeout(timer)
  }
}

export async function getMatchingCredentialsApi(
  url: string,
  matchBy: WebsiteMatchMode = 'host'
): Promise<MatchingCredentialsResult> {
  const query = new URLSearchParams({ url, matchBy })
  return bridgeFetch<MatchingCredentialsResult>(`/vault/match?${query.toString()}`)
}

export async function getCredentialApi(id: string): Promise<FillCredential> {
  return bridgeFetch<FillCredential>(`/vault/credentials/${id}`)
}

export async function createCredentialApi(payload: UpsertCredentialPayload): Promise<void> {
  await bridgeFetch<null>('/vault/credentials', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateCredentialApi(payload: UpdateCredentialPayload): Promise<void> {
  await bridgeFetch<null>(`/vault/credentials/${payload.credentialId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function saveCredentialApi(payload: SaveCredentialPayload): Promise<void> {
  await createCredentialApi({
    title: payload.title,
    username: payload.username,
    password: payload.password,
    websites: payload.website ? [payload.website] : []
  })
}

export async function deleteCredentialApi(id: string): Promise<void> {
  await bridgeFetch<null>(`/vault/credentials/${id}`, { method: 'DELETE' })
}

export async function toggleFavoriteApi(credentialId: string, favorite: boolean): Promise<void> {
  await bridgeFetch<null>(`/vault/favorites/${credentialId}/toggle`, {
    method: 'POST',
    body: JSON.stringify({ favorite })
  })
}

/** 桥接可用时聚焦桌面端窗口 */
export async function focusDesktopApi(): Promise<boolean> {
  try {
    await bridgeFetch<null>('/desktop/focus', { method: 'POST' })
    return true
  } catch {
    return false
  }
}

/** 唤起桌面端：已运行时聚焦；否则在当前网页触发协议，无法触达时打开带说明的扩展页 */
export async function wakeDesktopApi(preferredTabId?: number): Promise<WakeDesktopResult> {
  if (await focusDesktopApi()) return 'focused'

  let tabId = preferredTabId
  if (tabId == null) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    tabId = tab?.id
  }

  if (tabId != null) {
    try {
      const tab = await chrome.tabs.get(tabId)
      if (isWakeableWebTabUrl(tab.url) && (await triggerProtocolOnTab(tabId))) {
        return 'protocol-on-tab'
      }
    } catch {
      // 继续走备用页
    }
  }

  await chrome.tabs.create({ url: getWakeFallbackPageUrl(), active: true })
  return 'fallback-page'
}

export type { WakeDesktopResult }
export { DesktopBridgeError }
