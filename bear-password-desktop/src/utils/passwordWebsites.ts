import type { LoginContent, PasswordContent, PasswordEntry, PasswordType } from '@/types'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

function normalizeWebsites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
}

/** 从 content 中提取历史网站列表（兼容旧数据） */
export function extractWebsitesFromContent(content: Record<string, unknown>): string[] {
  return normalizeWebsites(content.websites)
}

/** 解析条目网站列表，优先使用数据库字段 */
export function resolveEntryWebsites(entry: PasswordEntry): string[] {
  if (entry.websites?.length) {
    return entry.websites.map((url) => url.trim()).filter(Boolean)
  }
  if (resolveEntryType(entry) !== '登录信息') {
    return []
  }
  if (isEncryptedContent(entry.content)) {
    return []
  }
  return extractWebsitesFromContent(entry.content as Record<string, unknown>)
}

export function formatWebsitesDisplay(websites: string[]): string {
  return websites.filter(Boolean).join(', ') || '-'
}

/** 从 content 中移除 websites 字段 */
export function stripWebsitesFromContent(content: PasswordContent): PasswordContent {
  if (isEncryptedContent(content)) {
    return content
  }
  const record = { ...(content as Record<string, unknown>) }
  delete record.websites
  return record as PasswordContent
}

export function contentHasWebsitesField(content: PasswordContent): boolean {
  if (isEncryptedContent(content)) {
    return false
  }
  return Array.isArray((content as Record<string, unknown>).websites)
}

/** 从登录表单构建待保存的 websites（仅登录信息类型） */
export function buildWebsitesFromForm(passwordType: PasswordType, login?: LoginContent): string[] {
  if (passwordType !== '登录信息' || !login) {
    return []
  }
  return login.websites.map((url) => url.trim()).filter(Boolean)
}

/** 编辑表单回填网站：优先 entry.websites，否则从 content 提取 */
export function resolveFormWebsites(entry: PasswordEntry, passwordType: PasswordType): string[] {
  if (passwordType !== '登录信息') {
    return []
  }
  const fromEntry = entry.websites?.map((url) => url.trim()).filter(Boolean) ?? []
  if (fromEntry.length) {
    return fromEntry
  }
  const fromContent = extractWebsitesFromContent(entry.content as Record<string, unknown>)
  return fromContent.length ? fromContent : ['']
}

export function needsWebsitesMigration(entry: PasswordEntry, plainContent: PasswordContent): boolean {
  if (contentHasWebsitesField(plainContent)) {
    return true
  }
  const entryType = resolveEntryType(entry)
  if (entryType !== '登录信息') {
    return false
  }
  const hasDbWebsites = (entry.websites?.length ?? 0) > 0
  if (hasDbWebsites) {
    return false
  }
  return extractWebsitesFromContent(plainContent as Record<string, unknown>).length > 0
}

/** 迁移时解析应写入数据库的网站列表 */
export function resolveMigrationWebsites(
  entry: PasswordEntry,
  entryType: PasswordType,
  plainContent: Record<string, unknown>
): string[] {
  if (entryType !== '登录信息') {
    return []
  }
  const fromEntry = entry.websites?.map((url) => url.trim()).filter(Boolean) ?? []
  if (fromEntry.length) {
    return fromEntry
  }
  return extractWebsitesFromContent(plainContent)
}
