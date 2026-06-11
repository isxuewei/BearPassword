import { storage } from './storage'

const STORAGE_KEY = 'server_origin'
const LEGACY_STORAGE_KEY = 'server_base_url'
/** 后端 context-path，与 application.yml 保持一致 */
export const API_CONTEXT_PATH = '/api'

/** 内置默认服务器地址 */
export function getDefaultServerOrigin(): string {
  return import.meta.env.VITE_SERVER_URL || 'http://127.0.0.1:8080'
}

/** 规范化服务器地址（仅 origin，不含路径） */
export function normalizeServerOrigin(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('服务器地址不能为空')
  }

  if (trimmed.startsWith('/')) {
    throw new Error('请填写服务器地址，例如 http://127.0.0.1:8080')
  }

  let url = trimmed
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`
  }

  url = url.replace(/\/api\/?$/i, '').replace(/\/+$/, '')

  try {
    const parsed = new URL(url)
    if (parsed.pathname && parsed.pathname !== '/') {
      throw new Error('请只填写服务器 IP 或域名，不要包含路径')
    }
    if (!parsed.hostname) {
      throw new Error('服务器地址格式不正确')
    }
    return parsed.origin
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('请')) {
      throw error
    }
    throw new Error('服务器地址格式不正确')
  }
}

function readStoredServerOrigin(): string | null {
  const candidates = [
    storage.get<string>(STORAGE_KEY),
    storage.get<string>(LEGACY_STORAGE_KEY)
  ]

  for (const stored of candidates) {
    if (!stored?.trim() || stored.startsWith('/')) continue
    try {
      return normalizeServerOrigin(stored)
    } catch {
      continue
    }
  }
  return null
}

/** 当前配置的服务器地址（origin） */
export function getServerOrigin(): string {
  return readStoredServerOrigin() ?? getDefaultServerOrigin()
}

/** 当前 API 请求 baseURL（origin + /api） */
export function getServerBaseUrl(): string {
  const origin = getServerOrigin()
  // 开发环境且为默认服务器时走 Vite 代理，避免 Electron 跨域导致 Network Error
  if (import.meta.env.DEV && origin === getDefaultServerOrigin()) {
    return API_CONTEXT_PATH
  }
  return `${origin}${API_CONTEXT_PATH}`
}

/** 保存前探测服务器是否可达 */
export async function probeServerOrigin(input: string): Promise<string> {
  const origin = normalizeServerOrigin(input)
  const healthUrl = `${origin}${API_CONTEXT_PATH}/health`
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(healthUrl, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`服务器返回 ${res.status}`)
    }
    const json = (await res.json()) as { code?: number; message?: string; data?: { status?: string } }
    if (json.code !== 0 && json.code !== 200) {
      throw new Error(json.message || '服务器响应异常')
    }
    if (json.data?.status !== 'UP') {
      throw new Error('后端服务未就绪')
    }
    return origin
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`连接超时，请确认 ${origin} 可访问`)
    }
    if (err instanceof TypeError) {
      throw new Error(`无法连接服务器 ${origin}，请检查地址与端口`)
    }
    throw err
  } finally {
    window.clearTimeout(timer)
  }
}

/** 保存服务器地址 */
export function saveServerOrigin(input: string): string {
  const normalized = normalizeServerOrigin(input)
  storage.set(STORAGE_KEY, normalized)
  storage.remove(LEGACY_STORAGE_KEY)
  return normalized
}

/** 恢复默认服务器地址 */
export function resetServerOrigin(): void {
  storage.remove(STORAGE_KEY)
  storage.remove(LEGACY_STORAGE_KEY)
}

/** 是否使用了自定义服务器地址 */
export function isCustomServerOrigin(): boolean {
  return !!readStoredServerOrigin()
}
