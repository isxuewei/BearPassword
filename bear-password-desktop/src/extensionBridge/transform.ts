import type { LoginContent, PasswordEntry } from '@/types'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { resolveEntryWebsites } from '@/utils/passwordWebsites'
import { entryMatchesPage } from '@/extensionBridge/websiteMatch'

export interface FillCredential {
  id: string
  title: string
  username: string
  password: string
  websites: string[]
  favorite?: boolean
}

export interface MatchingCredentialsResult {
  credentials: FillCredential[]
  needsSecurityKey: boolean
}

function isDecryptFailedContent(content: unknown): boolean {
  return !!(content as Record<string, unknown>)?.__decryptFailed__
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

  return {
    id: entry.id,
    title,
    username,
    password,
    websites: resolveEntryWebsites(entry),
    favorite: entry.favorite ?? false
  }
}

export function buildMatchingCredentialsResult(
  entries: PasswordEntry[],
  pageUrl: string,
  matchBy: 'host' | 'path' = 'host'
): MatchingCredentialsResult {
  const credentials = entries
    .map(toFillCredential)
    .filter((item): item is FillCredential => item !== null)
    .filter((item) => entryMatchesPage(item.websites, pageUrl, matchBy))

  const needsSecurityKey = entries.some((entry) => {
    if (entry.passwordType !== '登录信息') return false
    if (!entryMatchesPage(resolveEntryWebsites(entry), pageUrl, matchBy)) return false
    return isEncryptedContent(entry.content) || isDecryptFailedContent(entry.content)
  })

  return { credentials, needsSecurityKey }
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
