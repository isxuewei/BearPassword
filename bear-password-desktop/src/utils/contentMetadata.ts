import type { PasswordContent, PasswordEntry, PasswordType } from '@/types'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { extractTitleFromContent } from '@/utils/passwordTitle'
import { extractWebsitesFromContent } from '@/utils/passwordWebsites'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

export const CONTENT_LABELS_KEY = 'passwordLabels'
export const CONTENT_REMARK_KEY = 'remark'

export interface PasswordEntryApiParams {
  passwordType: PasswordType
  content: PasswordContent
}

export interface ContentMetadata {
  passwordTitle: string
  passwordLabels: string[]
  websites: string[]
  remark: string
}

function normalizeLabels(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
}

/** 仅读取 content 中显式写入的 title */
export function readExplicitTitleFromContent(plainContent: PasswordContent): string {
  if (isEncryptedContent(plainContent)) {
    return ''
  }
  return String((plainContent as Record<string, unknown>).title ?? '').trim()
}

/** 从 content 读取已嵌入的元数据（不含类型默认值） */
export function readEmbeddedMetadataFromPlainContent(
  plainContent: PasswordContent,
  passwordType: PasswordType
): ContentMetadata {
  const record = plainContent as Record<string, unknown>
  return {
    passwordTitle: readExplicitTitleFromContent(plainContent),
    passwordLabels: normalizeLabels(record[CONTENT_LABELS_KEY]),
    websites: passwordType === '登录信息' ? extractWebsitesFromContent(record) : [],
    remark: String(record[CONTENT_REMARK_KEY] ?? '').trim()
  }
}

/** 从明文 content 提取展示用元数据（含类型推导标题） */
export function extractMetadataFromPlainContent(
  plainContent: PasswordContent,
  passwordType: PasswordType
): ContentMetadata {
  const embedded = readEmbeddedMetadataFromPlainContent(plainContent, passwordType)
  if (embedded.passwordTitle) {
    return embedded
  }
  return {
    ...embedded,
    passwordTitle: extractTitleFromContent(passwordType, plainContent as Record<string, unknown>)
  }
}

/** 将元数据写入明文 content */
export function embedMetadataInPlainContent(
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

/** 表单参数合并元数据后生成 API 请求体 */
export function buildPasswordEntryApiParams(params: {
  passwordType: PasswordType
  passwordLabels: string[]
  remark?: string
  passwordTitle?: string
  websites?: string[]
  content: PasswordContent
}): PasswordEntryApiParams {
  const passwordTitle =
    params.passwordTitle?.trim() ||
    extractTitleFromContent(params.passwordType, params.content as Record<string, unknown>)

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

/** 解密/读取后从 content 解析衍生字段，供 UI 使用 */
export function enrichEntryFromContent(entry: PasswordEntry): PasswordEntry {
  if (isEncryptedContent(entry.content)) {
    return {
      ...entry,
      passwordLabels: entry.passwordLabels ?? [],
      remark: entry.remark ?? ''
    }
  }

  const entryType = resolveEntryType(entry)
  const metadata = extractMetadataFromPlainContent(entry.content, entryType)

  return {
    ...entry,
    passwordTitle: metadata.passwordTitle,
    passwordLabels: metadata.passwordLabels,
    remark: metadata.remark,
    websites: metadata.websites
  }
}
