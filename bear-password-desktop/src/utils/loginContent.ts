/**
 * 登录信息 content 读写
 */
import type { LoginContent, LoginExtraField } from '@/types'

export function createEmptyLoginContent(): LoginContent {
  return {
    title: '',
    username: '',
    password: '',
    websites: [''],
    host: '',
    extraFields: []
  }
}

function normalizeExtraFields(raw: unknown): LoginExtraField[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const field = item as Record<string, unknown>
    return {
      label: String(field.label ?? ''),
      value: String(field.value ?? '')
    }
  })
}

export function createServerPresetContent(): LoginContent {
  return {
    title: '',
    username: '',
    password: '',
    websites: [],
    host: '',
    extraFields: [
      { label: '端口', value: '22' },
      { label: '协议', value: 'SSH' }
    ]
  }
}

export function isServerLoginContent(content: Record<string, unknown>): boolean {
  if (String(content.host ?? content.ipAddress ?? '').trim()) return true
  if (String(content.title ?? '') === '服务器') return true
  const extras = content.extraFields
  if (!Array.isArray(extras)) return false
  return extras.some((item) => {
    const field = item as Record<string, unknown>
    return String(field.label ?? '') === '端口'
  })
}

export function normalizeLoginContent(raw: Record<string, unknown>): LoginContent {
  const username = String(raw.username ?? '')
  const password = String(raw.password ?? '')

  let websites: string[] = []
  if (Array.isArray(raw.websites)) {
    websites = raw.websites.map((item) => String(item ?? '')).filter(Boolean)
  }
  if (websites.length === 0 && !isServerLoginContent(raw)) {
    websites = ['']
  }

  return {
    title: String(raw.title ?? ''),
    username,
    password,
    websites,
    host: String(raw.host ?? raw.ipAddress ?? ''),
    extraFields: normalizeExtraFields(raw.extraFields)
  }
}

export function serializeLoginContent(content: LoginContent): LoginContent {
  return {
    title: content.title.trim(),
    username: content.username.trim(),
    password: content.password,
    websites: content.websites.map((url) => url.trim()).filter(Boolean),
    host: content.host.trim(),
    extraFields: content.extraFields.filter((field) => field.label.trim() || field.value.trim())
  }
}

export function getLoginWebsiteDisplay(content: Record<string, unknown>): string {
  const normalized = normalizeLoginContent(content)
  return normalized.websites.filter(Boolean).join(', ') || '-'
}

export function getLoginWebsites(content: Record<string, unknown>): string[] {
  return normalizeLoginContent(content).websites.filter(Boolean)
}

export function normalizeWebsiteHref(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return '#'
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function getLoginUsername(content: Record<string, unknown>): string {
  return normalizeLoginContent(content).username || '-'
}
