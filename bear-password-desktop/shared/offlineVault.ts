/** 离线模式配置 */
export interface OfflineVaultSettings {
  enabled: boolean
  /** 本地数据目录（绝对路径） */
  dataDir: string
}

/** 本地存储的密码条目（content 为密文 envelope 或明文对象） */
export interface OfflineVaultStoredEntry {
  id: number
  passwordType: string
  content: unknown
  createTime?: string
  updateTime?: string
}

export interface OfflineVaultRelationMeta {
  passwordId: number
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
    entries: Array.isArray(source.entries) ? source.entries : [],
    favorites: Array.isArray(source.favorites) ? source.favorites : [],
    recentVisits: Array.isArray(source.recentVisits) ? source.recentVisits : []
  }
}
