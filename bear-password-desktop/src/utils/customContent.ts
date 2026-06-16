/**
 * 自定义 content 读写
 */
import type { CustomContent, CustomField } from '@/types'

export function createEmptyCustomContent(): CustomContent {
  return {
    title: '',
    fields: []
  }
}

function normalizeFields(raw: unknown): CustomField[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const field = item as Record<string, unknown>
    return {
      label: String(field.label ?? ''),
      value: String(field.value ?? '')
    }
  })
}

export function normalizeCustomContent(raw: Record<string, unknown>): CustomContent {
  return {
    title: String(raw.title ?? '自定义'),
    fields: normalizeFields(raw.fields)
  }
}

export function serializeCustomContent(content: CustomContent): CustomContent {
  return {
    title: content.title.trim(),
    fields: content.fields.filter((field) => field.label.trim() || field.value.trim())
  }
}

export function getCustomTitle(content: Record<string, unknown>): string {
  const custom = normalizeCustomContent(content)
  if (custom.title.trim() && custom.title !== '自定义') return custom.title
  const firstNamed = custom.fields.find((field) => field.label.trim() && field.value.trim())
  if (firstNamed?.value.trim()) return firstNamed.value.trim()
  return '自定义'
}

export function isSecretCustomField(label: string): boolean {
  return /密码|pwd|pass|pin|cvv|secret|密钥|口令/i.test(label)
}
