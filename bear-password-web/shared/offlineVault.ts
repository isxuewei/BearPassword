/** 离线模式配置 */
export interface OfflineVaultSettings {
  enabled: boolean
  /** 本地数据目录（绝对路径） */
  dataDir: string
}

/** 本地存储的密码条目（content 为密文 envelope 或明文对象） */
export interface OfflineVaultStoredEntry {
  id: string
  passwordType: string
  content: unknown
  createTime?: string
  updateTime?: string
}

export interface OfflineVaultRelationMeta {
  passwordId: string
  time?: string
}

/** 本地 vault 数据快照 */
export interface OfflineVaultSnapshot {
  version: 1
  nextId: number
  entries: OfflineVaultStoredEntry[]
  favorites: OfflineVaultRelationMeta[]
  recentVisits: OfflineVaultRelationMeta[]
}

import { toVaultEntryId } from './vaultEntryId'
export const OFFLINE_VAULT_DATA_FILE = 'vault-data.json'
export const OFFLINE_VAULT_SETTINGS_FILE = 'offline-vault-settings.json'

export const DEFAULT_OFFLINE_VAULT_SNAPSHOT: OfflineVaultSnapshot = {
  version: 1,
  nextId: 1,
  entries: [],
  favorites: [],
  recentVisits: []
}

export function normalizeOfflineVaultSettings(
  raw: Partial<OfflineVaultSettings> | null | undefined,
  defaultDataDir: string
): OfflineVaultSettings {
  const dataDir =
    typeof raw?.dataDir === 'string' && raw.dataDir.trim() ? raw.dataDir.trim() : defaultDataDir

  return {
    enabled: raw?.enabled === true,
    dataDir
  }
}

export function normalizeOfflineVaultSnapshot(raw: unknown): OfflineVaultSnapshot {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_OFFLINE_VAULT_SNAPSHOT }
  }

  const source = raw as Partial<OfflineVaultSnapshot>
  const nextId = typeof source.nextId === 'number' && source.nextId > 0 ? source.nextId : 1

  return {
    version: 1,
    nextId,
    entries: Array.isArray(source.entries)
      ? source.entries.map((entry) => ({
          ...entry,
          id: toVaultEntryId((entry as OfflineVaultStoredEntry).id)
        }))
      : [],
    favorites: Array.isArray(source.favorites)
      ? source.favorites.map((item) => ({
          ...item,
          passwordId: toVaultEntryId((item as OfflineVaultRelationMeta).passwordId)
        }))
      : [],
    recentVisits: Array.isArray(source.recentVisits)
      ? source.recentVisits.map((item) => ({
          ...item,
          passwordId: toVaultEntryId((item as OfflineVaultRelationMeta).passwordId)
        }))
      : []
  }
}

function mergeRelationMeta(
  localItems: OfflineVaultRelationMeta[],
  incomingItems: OfflineVaultRelationMeta[]
): OfflineVaultRelationMeta[] {
  const localIds = new Set(localItems.map((item) => item.passwordId))
  const merged = [...localItems]
  for (const item of incomingItems) {
    if (!localIds.has(item.passwordId)) {
      merged.push(item)
    }
  }
  return merged
}

function mergeRecentVisits(
  localItems: OfflineVaultRelationMeta[],
  incomingItems: OfflineVaultRelationMeta[]
): OfflineVaultRelationMeta[] {
  return mergeRelationMeta(localItems, incomingItems).slice(0, 200)
}

/**
 * 合并离线快照：相同 ID 以本地为准，仅补充对方独有的条目与元数据。
 */
export function mergeOfflineVaultSnapshots(
  local: OfflineVaultSnapshot,
  incoming: OfflineVaultSnapshot
): OfflineVaultSnapshot {
  const normalizedLocal = normalizeOfflineVaultSnapshot(local)
  const normalizedIncoming = normalizeOfflineVaultSnapshot(incoming)

  const localEntryIds = new Set(normalizedLocal.entries.map((entry) => toVaultEntryId(entry.id)))
  const mergedEntries = [...normalizedLocal.entries]
  for (const entry of normalizedIncoming.entries) {
    const entryId = toVaultEntryId(entry.id)
    if (!localEntryIds.has(entryId)) {
      mergedEntries.push({ ...entry, id: entryId })
      localEntryIds.add(entryId)
    }
  }

  return {
    version: 1,
    nextId: 1,
    entries: mergedEntries,
    favorites: mergeRelationMeta(normalizedLocal.favorites, normalizedIncoming.favorites),
    recentVisits: mergeRecentVisits(normalizedLocal.recentVisits, normalizedIncoming.recentVisits)
  }
}
