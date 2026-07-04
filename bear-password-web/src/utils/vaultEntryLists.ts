import type { PasswordEntry } from '@/types'
import { toVaultEntryId, type VaultEntryId } from '../../shared/vaultEntryId'

export interface PasswordRelationMetaItem {
  passwordId: VaultEntryId
  time?: string
}

export interface FavoriteMetaItem {
  passwordId: VaultEntryId
  favoriteTime: string
}

export interface RecentVisitMetaItem {
  passwordId: VaultEntryId
  recentVisitTime: string
}

function toEntryMap(entries: PasswordEntry[]): Map<VaultEntryId, PasswordEntry> {
  return new Map(entries.map((entry) => [toVaultEntryId(entry.id), entry]))
}

/** 从密码库缓存 + 收藏元数据组装收藏列表 */
export function buildFavoriteEntries(
  allEntries: PasswordEntry[],
  meta: FavoriteMetaItem[]
): PasswordEntry[] {
  const entryMap = toEntryMap(allEntries)
  const result: PasswordEntry[] = []

  for (const item of meta) {
    const entry = entryMap.get(toVaultEntryId(item.passwordId))
    if (!entry) continue
    result.push({
      ...entry,
      favorite: true,
      favoriteTime: item.favoriteTime
    })
  }

  return result
}

/** 从密码库缓存 + 最近访问元数据组装最近访问列表 */
export function buildRecentEntries(
  allEntries: PasswordEntry[],
  meta: RecentVisitMetaItem[]
): PasswordEntry[] {
  const entryMap = toEntryMap(allEntries)
  const result: PasswordEntry[] = []

  for (const item of meta) {
    const entry = entryMap.get(toVaultEntryId(item.passwordId))
    if (!entry) continue
    result.push({
      ...entry,
      recentVisitTime: item.recentVisitTime
    })
  }

  return result
}

export function mapFavoriteMeta(items: PasswordRelationMetaItem[]): FavoriteMetaItem[] {
  return items.map((item) => ({
    passwordId: toVaultEntryId(item.passwordId),
    favoriteTime: item.time ?? ''
  }))
}

export function mapRecentVisitMeta(items: PasswordRelationMetaItem[]): RecentVisitMetaItem[] {
  return items.map((item) => ({
    passwordId: toVaultEntryId(item.passwordId),
    recentVisitTime: item.time ?? ''
  }))
}
