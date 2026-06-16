import type {
  BankCardContent,
  CustomContent,
  DatabaseContent,
  IdentityContent,
  LoginContent,
  PasswordContent,
  PasswordEntry,
  PasswordType,
  SecureNoteContent
} from '@/types'
import { getBankCardTitle } from '@/utils/bankCardContent'
import { getCustomTitle } from '@/utils/customContent'
import { getDatabaseTitle } from '@/utils/databaseContent'
import { getIdentityTitle } from '@/utils/identityContent'
import { normalizeSecureNoteContent } from '@/utils/secureNoteContent'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { isDecryptFailedContent } from '@/utils/vaultEntryTransform'

/** 从 content 中提取历史标题（兼容旧数据） */
export function extractTitleFromContent(
  passwordType: PasswordType,
  content: Record<string, unknown>
): string {
  switch (passwordType) {
    case '登录信息':
    case '服务器': {
      const title = String(content.title ?? '').trim()
      if (title) return title
      return passwordType === '服务器' ? '服务器' : '未命名'
    }
    case '银行卡':
      return getBankCardTitle(content)
    case '身份信息':
      return getIdentityTitle(content)
    case '安全备注':
      return normalizeSecureNoteContent(content).title.trim() || '安全备注'
    case '自定义':
      return getCustomTitle(content)
    case '数据库':
      return getDatabaseTitle(content)
    default:
      return String(content.title ?? '').trim() || '未命名'
  }
}

/** 解析条目展示标题（需先 enrichEntryFromContent 或从 content 解析） */
export function resolveEntryTitle(entry: PasswordEntry): string {
  if (entry.passwordTitle?.trim()) {
    return entry.passwordTitle.trim()
  }
  if (isDecryptFailedContent(entry.content)) {
    return String((entry.content as Record<string, unknown>).title ?? '解密失败')
  }
  const entryType = resolveEntryType(entry)
  if (isEncryptedContent(entry.content)) {
    return '内容已加密'
  }
  return extractTitleFromContent(entryType, entry.content as Record<string, unknown>)
}

/** 从表单内容构建待保存的 passwordTitle */
export function buildPasswordTitleFromForm(
  passwordType: PasswordType,
  sources: {
    login?: LoginContent
    bank?: BankCardContent
    identity?: IdentityContent
    secureNote?: SecureNoteContent
    custom?: CustomContent
    database?: DatabaseContent
  }
): string {
  switch (passwordType) {
    case '登录信息':
    case '服务器':
      return sources.login?.title.trim() || (passwordType === '服务器' ? '服务器' : '未命名')
    case '银行卡': {
      const card = sources.bank!
      if (card.title.trim() && card.title.trim() !== '银行卡') return card.title.trim()
      return card.bankName.trim() || '银行卡'
    }
    case '身份信息': {
      const identity = sources.identity!
      if (identity.title.trim() && identity.title.trim() !== '身份标识') return identity.title.trim()
      return identity.name.trim() || '身份标识'
    }
    case '安全备注': {
      const note = sources.secureNote!
      if (note.title.trim() && note.title.trim() !== '安全备注') return note.title.trim()
      return '安全备注'
    }
    case '自定义': {
      const custom = sources.custom!
      if (custom.title.trim() && custom.title.trim() !== '自定义') return custom.title.trim()
      const first = custom.fields.find((field) => field.label.trim() && field.value.trim())
      return first?.value.trim() || '自定义'
    }
    case '数据库': {
      const database = sources.database!
      if (database.title.trim() && database.title.trim() !== '数据库') return database.title.trim()
      return database.dbType.trim() || database.host.trim() || '数据库'
    }
    default:
      return '未命名'
  }
}

import { readExplicitTitleFromContent } from '@/utils/contentMetadata'

/** 编辑表单回填标题 */
export function resolveFormTitle(entry: PasswordEntry, passwordType: PasswordType): string {
  if (!isEncryptedContent(entry.content)) {
    const explicit = readExplicitTitleFromContent(entry.content)
    if (explicit) return explicit
  }
  return extractTitleFromContent(passwordType, entry.content as Record<string, unknown>)
}
