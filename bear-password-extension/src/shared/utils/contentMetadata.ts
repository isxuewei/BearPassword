import type { PasswordContent, PasswordEntry, PasswordEntryParams, PasswordType } from '@/shared/types'
import { isEncryptedContent } from '@/shared/utils/contentCrypto'

export const CONTENT_LABELS_KEY = 'passwordLabels'
export const CONTENT_REMARK_KEY = 'remark'

export interface PasswordEntryApiParams {
  passwordType: PasswordType
  content: PasswordContent
}

function normalizeLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
}

function readExplicitTitleFromContent(plainContent: PasswordContent): string {
  if (isEncryptedContent(plainContent)) {
    return ''
  }
  return String((plainContent as Record<string, unknown>).title ?? '').trim()
}

function embedMetadataInPlainContent(
  plainContent: PasswordContent,
  metadata: {
    passwordType: PasswordType
    passwordLabels: string[]
    remark?: string
    passwordTitle?: string
    websites?: string[]
  }
): PasswordContent {
  if (isEncryptedContent(plainContent)) {
    return plainContent
  }

  const record = { ...(plainContent as Record<string, unknown>) }
  const labels = normalizeLabels(metadata.passwordLabels)
  if (labels.length) {
    record[CONTENT_LABELS_KEY] = labels
  } else {
    delete record[CONTENT_LABELS_KEY]
  }

  const remark = String(metadata.remark ?? '').trim()
  if (remark) {
    record[CONTENT_REMARK_KEY] = remark
  } else {
    delete record[CONTENT_REMARK_KEY]
  }

  const title = metadata.passwordTitle?.trim()
  if (title) {
    record.title = title
  }

  if (metadata.passwordType === '登录信息') {
    const websites = (metadata.websites ?? []).map((url) => url.trim()).filter(Boolean)
    if (websites.length) {
      record.websites = websites
    } else {
      delete record.websites
    }
  }

  return record as PasswordContent
}

export function buildPasswordEntryApiParams(params: PasswordEntryParams): PasswordEntryApiParams {
  const passwordTitle =
    params.passwordTitle?.trim() || readExplicitTitleFromContent(params.content)

  const content = embedMetadataInPlainContent(params.content, {
    passwordType: params.passwordType,
    passwordLabels: params.passwordLabels,
    remark: params.remark,
    passwordTitle,
    websites: params.websites
  })

  return {
    passwordType: params.passwordType,
    content
  }
}

export function enrichEntryFromContent(entry: PasswordEntry): PasswordEntry {
  if (isEncryptedContent(entry.content)) {
    return {
      ...entry,
      passwordLabels: entry.passwordLabels ?? [],
      remark: entry.remark ?? ''
    }
  }

  const record = entry.content as Record<string, unknown>
  return {
    ...entry,
    passwordTitle: readExplicitTitleFromContent(entry.content) || entry.passwordTitle,
    passwordLabels: normalizeLabels(record[CONTENT_LABELS_KEY]),
    remark: String(record[CONTENT_REMARK_KEY] ?? '').trim(),
    websites:
      entry.passwordType === '登录信息'
        ? (Array.isArray(record.websites)
            ? record.websites.map((item) => String(item ?? '').trim()).filter(Boolean)
            : [])
        : entry.websites
  }
}
