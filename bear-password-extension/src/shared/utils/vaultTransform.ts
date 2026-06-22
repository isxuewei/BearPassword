import type {
  FillCredential,
  LoginContent,
  MatchingCredentialsResult,
  PasswordContent,
  PasswordEntry,
  PasswordEntryParams
} from '@/shared/types'
import { extractLoginAuthenticatorFromContent } from '@/shared/utils/extraField'
import {
  decryptContentObject,
  encryptContentObject,
  isEncryptedContent,
  type VaultUnlockContext
} from '@/shared/utils/contentCrypto'
import {
  buildPasswordEntryApiParams,
  enrichEntryFromContent,
  type PasswordEntryApiParams
} from '@/shared/utils/contentMetadata'
import { SecurityKeyRequiredError } from '@/shared/utils/securityKeyRequired'
import type { WebsiteMatchMode } from '@/shared/types'
import { entryMatchesPage } from '@/shared/utils/websiteMatch'

export function isDecryptFailedContent(content: PasswordContent): boolean {
  return !!(content as Record<string, unknown>).__decryptFailed__
}

export function resolveEntryWebsites(entry: PasswordEntry): string[] {
  if (entry.passwordType !== '登录信息' || isEncryptedContent(entry.content)) {
    return []
  }
  if (entry.websites?.length) {
    return entry.websites.map((url) => url.trim()).filter(Boolean)
  }
  const content = entry.content as LoginContent
  return (content.websites ?? []).map((url) => url.trim()).filter(Boolean)
}

export async function decryptPasswordEntry(
  entry: PasswordEntry,
  unlock: VaultUnlockContext | null
): Promise<PasswordEntry> {
  if (!unlock) {
    if (isEncryptedContent(entry.content)) {
      return {
        ...entry,
        content: { title: '内容已加密', __decryptFailed__: true },
        passwordLabels: [],
        remark: ''
      }
    }
    return enrichEntryFromContent(entry)
  }

  if (!isEncryptedContent(entry.content)) {
    return enrichEntryFromContent(entry)
  }

  try {
    const content = await decryptContentObject(entry.content, unlock)
    return enrichEntryFromContent({ ...entry, content })
  } catch {
    return {
      ...entry,
      content: { title: '解密失败，请检查安全密钥', __decryptFailed__: true },
      passwordLabels: [],
      remark: ''
    }
  }
}

export async function encryptPasswordEntryParams(
  params: PasswordEntryParams,
  unlock: VaultUnlockContext | null
): Promise<PasswordEntryApiParams> {
  if (!unlock?.vuk) {
    throw new SecurityKeyRequiredError()
  }

  const apiParams = buildPasswordEntryApiParams(params)
  const content = await encryptContentObject(apiParams.content, unlock)
  return { passwordType: apiParams.passwordType, content: content as unknown as PasswordContent }
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
  favoriteIds: string[]
): FillCredential[] {
  const idSet = new Set(favoriteIds)
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

  return { credentials, needsSecurityKey, desktopUnlocked: true }
}

export function toFillCredential(entry: PasswordEntry): FillCredential | null {
  if (entry.passwordType !== '登录信息') return null
  if (isEncryptedContent(entry.content)) return null
  if (isDecryptFailedContent(entry.content)) return null

  const content = entry.content as LoginContent
  const title = content.title?.trim() || entry.passwordTitle?.trim() || '未命名'
  const username = content.username ?? ''
  const password = content.password ?? ''
  if (!username && !password) return null

  const authenticator = extractLoginAuthenticatorFromContent(content)

  return {
    id: entry.id,
    title,
    username,
    password,
    websites: resolveEntryWebsites(entry),
    favorite: entry.favorite ?? false,
    ...(authenticator ? { authenticator } : {})
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
