/**
 * 安全备注 content 读写
 */
import type { LoginExtraField, SecureNoteContent } from '@/types'

export function createEmptySecureNoteContent(): SecureNoteContent {
  return {
    title: '',
    body: '',
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

export function normalizeSecureNoteContent(raw: Record<string, unknown>): SecureNoteContent {
  return {
    title: String(raw.title ?? '安全备注'),
    body: String(raw.body ?? ''),
    extraFields: normalizeExtraFields(raw.extraFields)
  }
}

export function serializeSecureNoteContent(content: SecureNoteContent): SecureNoteContent {
  return {
    title: content.title.trim(),
    body: content.body,
    extraFields: content.extraFields.filter((field) => field.label.trim() || field.value.trim())
  }
}

export function getSecureNoteBodyPreview(content: Record<string, unknown>): string {
  const text = String(content.body ?? '').trim()
  if (!text) return '-'
  return text.length > 120 ? `${text.slice(0, 120)}…` : text
}
