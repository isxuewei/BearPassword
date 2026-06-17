export const API_CONTEXT_PATH = '/api'

export function getDefaultServerOrigin(): string {
  const fromEnv = import.meta.env.VITE_SERVER_URL?.trim()
  if (fromEnv) return fromEnv
  return import.meta.env.PROD ? 'https://bear-password.xuewei.fun' : 'http://127.0.0.1:8080'
}

export function normalizeServerOrigin(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('服务器地址不能为空')
  }

  let url = trimmed
  if (!/^https?:\/\//i.test(url)) {
    url = `http://${url}`
  }

  url = url.replace(/\/api\/?$/i, '').replace(/\/+$/, '')

  const parsed = new URL(url)
  if (parsed.pathname && parsed.pathname !== '/') {
    throw new Error('请只填写服务器地址，不要包含路径')
  }
  return parsed.origin
}

export function getServerBaseUrl(origin: string): string {
  return `${origin}${API_CONTEXT_PATH}`
}

export async function probeServerOrigin(input: string): Promise<string> {
  const origin = normalizeServerOrigin(input)
  const healthUrl = `${origin}${API_CONTEXT_PATH}/health`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)

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
      throw new Error(`无法连接服务器 ${origin}`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}
