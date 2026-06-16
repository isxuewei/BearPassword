import type { LoginContent, PasswordEntry, PasswordType } from '@/types'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

function normalizeWebsites(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => String(item ?? '').trim()).filter(Boolean)
}

/** 从 content 中提取网站列表 */
export function extractWebsitesFromContent(content: Record<string, unknown>): string[] {
  return normalizeWebsites(content.websites)
}

/** 解析条目网站列表（需先 enrichEntryFromContent） */
export function resolveEntryWebsites(entry: PasswordEntry): string[] {
  if (resolveEntryType(entry) !== '登录信息') {
    return []
  }
  if (entry.websites?.length) {
    return entry.websites.map((url) => url.trim()).filter(Boolean)
  }
  if (isEncryptedContent(entry.content)) {
    return []
  }
  return extractWebsitesFromContent(entry.content as Record<string, unknown>)
}

export function formatWebsitesDisplay(websites: string[]): string {
  return websites.filter(Boolean).join(', ') || '-'
}

/** 从登录表单构建待保存的 websites（仅登录信息类型） */
export function buildWebsitesFromForm(passwordType: PasswordType, login?: LoginContent): string[] {
  if (passwordType !== '登录信息' || !login) {
    return []
  }
  return login.websites.map((url) => url.trim()).filter(Boolean)
}

/** 编辑表单回填网站 */
export function resolveFormWebsites(entry: PasswordEntry, passwordType: PasswordType): string[] {
  if (passwordType !== '登录信息') {
    return []
  }
  const fromContent = extractWebsitesFromContent(entry.content as Record<string, unknown>)
  if (fromContent.length) {
    return fromContent
  }
  return ['']
}
