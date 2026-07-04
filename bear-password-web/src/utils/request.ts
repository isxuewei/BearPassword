import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'
import { getErrorMessage, resolveAxiosErrorMessage } from '@/utils/apiErrorMessage'
import { getServerBaseUrl } from './serverUrl'
import { storage } from './storage'

/**
 * Axios 二次封装
 * - 统一 baseURL、超时、请求/响应拦截
 * - 自动携带 Token
 * - 统一错误处理
 */

const TIMEOUT = 15000

const service: AxiosInstance = axios.create({
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
})

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null
let handlingUnauthorized = false

/** 在应用初始化后绑定：401 时清会话并跳转登录页 */
export function bindUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler
}

function shouldIgnoreUnauthorized(config?: AxiosRequestConfig): boolean {
  const url = config?.url ?? ''
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/register')
  )
}

function triggerUnauthorized(config?: AxiosRequestConfig): void {
  if (shouldIgnoreUnauthorized(config) || handlingUnauthorized) return

  handlingUnauthorized = true
  try {
    unauthorizedHandler?.()
  } finally {
    queueMicrotask(() => {
      handlingUnauthorized = false
    })
  }
}

function isUnauthorizedPayload(status?: number, code?: number): boolean {
  return status === 401 || code === 401
}

export function isUnauthorizedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message
  return message.includes('未登录') || message.includes('登录已过期') || /unauthorized/i.test(message)
}

/** 请求拦截：动态 baseURL + 自动注入 Token */
service.interceptors.request.use(
  (config) => {
    config.baseURL = getServerBaseUrl()
    const token = storage.get<string>('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

/** 响应拦截：统一解析 ApiResponse 结构 */
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (isUnauthorizedPayload(response.status, res.code)) {
      triggerUnauthorized(response.config)
      return Promise.reject(new Error(res.message || '未登录或登录已过期'))
    }
    if (res.code === 0 || res.code === 200) {
      return response
    }
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const data = error.response?.data as ApiResponse | undefined
      if (isUnauthorizedPayload(status, data?.code)) {
        triggerUnauthorized(error.config)
      }
      return Promise.reject(new Error(resolveAxiosErrorMessage(error)))
    }
    return Promise.reject(new Error(getErrorMessage(error)))
  }
)

/** 封装常用请求方法，直接返回 data 字段 */
export const request = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get<ApiResponse<T>>(url, config).then((res) => res.data.data)
  },

  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.post<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return service.put<ApiResponse<T>>(url, data, config).then((res) => res.data.data)
  },

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete<ApiResponse<T>>(url, config).then((res) => res.data.data)
  }
}

export default service
