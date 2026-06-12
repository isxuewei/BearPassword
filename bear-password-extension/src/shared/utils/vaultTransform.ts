import type {
  FillCredential,
  LoginContent,
  MatchingCredentialsResult,
  PasswordContent,
  PasswordEntry,
  PasswordEntryParams
} from '@/shared/types'
import {
  decryptContentObject,
  encryptContentObject,
  isEncryptedContent
} from '@/shared/utils/contentCrypto'
import type { WebsiteMatchMode } from '@/shared/types'
import { entryMatchesPage } from '@/shared/utils/websiteMatch'

export function isDecryptFailedContent(content: PasswordContent): boolean {
  return !!(content as Record<string, unknown>).__decryptFailed__
}

export function resolveEntryWebsites(entry: PasswordEntry): string[] {
  if (entry.websites?.length) {
    return entry.websites.map((url) => url.trim()).filter(Boolean)
  }
  if (entry.passwordType !== '登录信息' || isEncryptedContent(entry.content)) {
    return []
  }
  const content = entry.content as LoginContent
  return (content.websites ?? []).map((url) => url.trim()).filter(Boolean)
}

export async function decryptPasswordEntry(
  entry: PasswordEntry,
  passphrase: string | null
): Promise<PasswordEntry> {
  if (!passphrase) {
    if (isEncryptedContent(entry.content)) {
      return {
        ...entry,
        content: { title: '内容已加密', __decryptFailed__: true }
      }
    }
    return entry
  }

  if (!isEncryptedContent(entry.content)) {
    return entry
  }

  try {
    const content = await decryptContentObject(entry.content, passphrase)
    return { ...entry, content }
  } catch {
    return {
      ...entry,
      content: { title: '解密失败，请检查安全密钥', __decryptFailed__: true }
    }
  }
}

export async function encryptPasswordEntryParams(
  params: PasswordEntryParams,
  passphrase: string | null
): Promise<PasswordEntryParams> {
  if (!passphrase) return params
  const content = await encryptContentObject(params.content, passphrase)
  return { ...params, content: content as unknown as PasswordContent }
}

/** 条目匹配当前网站但无法解密（未配置或密钥错误） */
export function isEntryBlockedForAutofill(
  entry: PasswordEntry,
  pageUrl: string,
  matchBy: WebsiteMatchMode = 'host'
): boolean {
  if (entry.passwordType !== '登录信息') return false
  if (!entryMatchesPage(resolveEntryWebsites(entry), pageUrl, matchBy)) return false
  return isEncryptedContent(entry.content) || isDecryptFailedContent(entry.content)
}

export function applyFavoriteState(
  credentials: FillCredential[],
  favoriteIds: number[]
): FillCredential[] {
  const idSet = new Set(favoriteIds.map((id) => Number(id)))
  return credentials.map((item) => ({
    ...item,
    favorite: idSet.has(item.id)
  }))
}

export function buildMatchingCredentialsResult(
  entries: PasswordEntry[],
  pageUrl: string,
  matchBy: WebsiteMatchMode = 'host'
): MatchingCredentialsResult {
  const credentials = entries
    .map(toFillCredential)
    .filter((item): item is FillCredential => item !== null)
    .filter((item) => entryMatchesPage(item.websites, pageUrl, matchBy))

  const needsSecurityKey = entries.some((entry) => isEntryBlockedForAutofill(entry, pageUrl, matchBy))

  return { credentials, needsSecurityKey }
}

export function toFillCredential(entry: PasswordEntry): FillCredential | null {
  if (entry.passwordType !== '登录信息') return null
  if (isEncryptedContent(entry.content)) return null
  if (isDecryptFailedContent(entry.content)) return null

  const content = entry.content as LoginContent
  const title = entry.passwordTitle || content.title || '未命名'
  const username = content.username ?? ''
  const password = content.password ?? ''
  if (!username && !password) return null

  return {
    id: entry.id,
    title,
    username,
    password,
    websites: resolveEntryWebsites(entry),
    favorite: entry.favorite ?? false
  }
}

export function buildLoginEntryParams(
  title: string,
  username: string,
  password: string,
  websiteOrWebsites: string | string[],
  options?: { extraFields?: LoginContent['extraFields']; remark?: string }
): PasswordEntryParams {
  const websites = (
    Array.isArray(websiteOrWebsites)
      ? websiteOrWebsites
      : websiteOrWebsites
        ? [websiteOrWebsites]
        : []
  )
    .map((url) => url.trim())
    .filter(Boolean)

  const content: LoginContent = {
    title,
    username,
    password,
    websites,
    host: '',
    extraFields: options?.extraFields ?? []
  }
  return {
    passwordType: '登录信息',
    passwordLabels: [],
    passwordTitle: title,
    content,
    websites,
    remark: options?.remark ?? ''
  }
}
