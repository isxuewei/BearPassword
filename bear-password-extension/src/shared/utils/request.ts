import type { ApiResponse } from '@/shared/types'
import { getServerBaseUrl } from '@/shared/utils/serverUrl'

const TIMEOUT = 15000

function isUnauthorized(status?: number, code?: number): boolean {
  return status === 401 || code === 401
}

async function request<T>(
  method: string,
  path: string,
  options: {
    origin: string
    token?: string | null
    body?: unknown
    params?: Record<string, string | number | undefined>
  }
): Promise<T> {
  const baseUrl = getServerBaseUrl(options.origin)
  const url = new URL(`${baseUrl}${path}`)
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  try {
    const res = await fetch(url.toString(), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal
    })

    const json = (await res.json()) as ApiResponse<T>
    if (isUnauthorized(res.status, json.code)) {
      throw new Error(json.message || '未登录或登录已过期')
    }
    if (json.code !== 0 && json.code !== 200) {
      throw new Error(json.message || '请求失败')
    }
    return json.data
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('请求超时')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export const http = {
  get<T>(
    path: string,
    options: { origin: string; token?: string | null; params?: Record<string, string | number | undefined> }
  ): Promise<T> {
    return request<T>('GET', path, options)
  },
  post<T>(
    path: string,
    body: unknown,
    options: { origin: string; token?: string | null }
  ): Promise<T> {
    return request<T>('POST', path, { ...options, body })
  },
  put<T>(
    path: string,
    body: unknown,
    options: { origin: string; token?: string | null }
  ): Promise<T> {
    return request<T>('PUT', path, { ...options, body })
  },
  delete<T>(path: string, options: { origin: string; token?: string | null }): Promise<T> {
    return request<T>('DELETE', path, options)
  }
}
