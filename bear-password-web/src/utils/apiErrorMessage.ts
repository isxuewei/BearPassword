import axios, { type AxiosError } from 'axios'
import type { ApiResponse } from '@/types'

const AXIOS_STATUS_PATTERN = /^Request failed with status code (\d+)$/i
const AXIOS_TIMEOUT_PATTERN = /^timeout of \d+ms exceeded$/i

function isTechnicalEnglishMessage(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return true
  return (
    AXIOS_STATUS_PATTERN.test(trimmed) ||
    AXIOS_TIMEOUT_PATTERN.test(trimmed) ||
    trimmed === 'Network Error' ||
    /^Network Error$/i.test(trimmed)
  )
}

function statusToMessage(status?: number): string {
  switch (status) {
    case 400:
      return '请求参数有误，请检查后重试'
    case 401:
      return '未登录或登录已过期'
    case 403:
      return '没有权限执行此操作'
    case 404:
      return '请求的资源不存在'
    case 408:
      return '请求超时，请稍后重试'
    case 429:
      return '操作过于频繁，请稍后再试'
    case 500:
      return '服务器内部错误，请稍后重试'
    case 502:
      return '网关错误，服务暂时不可用'
    case 503:
      return '服务暂时不可用，请稍后重试'
    case 504:
      return '网关超时，请稍后重试'
    default:
      return status ? `请求失败（${status}）` : '网络异常，请检查网络连接'
  }
}

function readBackendMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const message = (data as ApiResponse).message
  return typeof message === 'string' ? message.trim() : ''
}

export function resolveAxiosErrorMessage(error: AxiosError<ApiResponse>): string {
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return '无法连接服务器，请检查网络或稍后重试'
  }
  if (error.code === 'ECONNABORTED' || AXIOS_TIMEOUT_PATTERN.test(error.message)) {
    return '请求超时，请稍后重试'
  }

  const status = error.response?.status
  const backendMessage = readBackendMessage(error.response?.data)

  if (backendMessage && !isTechnicalEnglishMessage(backendMessage)) {
    return backendMessage
  }

  const statusMatch = error.message.match(AXIOS_STATUS_PATTERN)
  if (statusMatch) {
    return statusToMessage(Number(statusMatch[1]) || status)
  }

  if (isTechnicalEnglishMessage(error.message)) {
    return statusToMessage(status)
  }

  return backendMessage || error.message || statusToMessage(status)
}

/** 将未知错误转为面向用户的中文提示 */
export function getErrorMessage(error: unknown, fallback = '请求失败，请稍后重试'): string {
  if (axios.isAxiosError(error)) {
    return resolveAxiosErrorMessage(error)
  }
  if (error instanceof Error) {
    if (isTechnicalEnglishMessage(error.message)) {
      return fallback
    }
    return error.message.trim() || fallback
  }
  if (typeof error === 'string' && !isTechnicalEnglishMessage(error)) {
    return error
  }
  return fallback
}
