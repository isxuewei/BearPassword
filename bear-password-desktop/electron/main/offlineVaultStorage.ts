import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_OFFLINE_VAULT_SNAPSHOT,
  normalizeOfflineVaultSnapshot,
  OFFLINE_VAULT_DATA_FILE,
  type OfflineVaultRelationMeta,
  type OfflineVaultSnapshot,
  type OfflineVaultStoredEntry
} from '../../shared/offlineVault'
import { generateOfflineSnowflakeId } from '../../shared/snowflakeId'
import { toVaultEntryId } from '../../shared/vaultEntryId'
import { ensureOfflineVaultDataDir } from './offlineVaultConfig'

function getDataFilePath(dataDir: string): string {
  return join(dataDir, OFFLINE_VAULT_DATA_FILE)
}

function readSnapshotFile(dataDir: string): OfflineVaultSnapshot {
  ensureOfflineVaultDataDir(dataDir)
  const filePath = getDataFilePath(dataDir)

  if (!existsSync(filePath)) {
    return { ...DEFAULT_OFFLINE_VAULT_SNAPSHOT }
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf-8'))
    return normalizeOfflineVaultSnapshot(raw)
  } catch {
    return { ...DEFAULT_OFFLINE_VAULT_SNAPSHOT }
  }
}

function writeSnapshotFile(dataDir: string, snapshot: OfflineVaultSnapshot): void {
  ensureOfflineVaultDataDir(dataDir)
  const normalized = normalizeOfflineVaultSnapshot(snapshot)
  writeFileSync(getDataFilePath(dataDir), JSON.stringify(normalized, null, 2), 'utf-8')
}

function withSnapshot<T>(dataDir: string, mutate: (snapshot: OfflineVaultSnapshot) => T): T {
  const snapshot = readSnapshotFile(dataDir)
  const result = mutate(snapshot)
  writeSnapshotFile(dataDir, snapshot)
  return result
}

function sameEntryId(a: string | number, b: string | number): boolean {
  return toVaultEntryId(a) === toVaultEntryId(b)
}

export function readOfflineVaultSnapshot(dataDir: string): OfflineVaultSnapshot {
  return readSnapshotFile(dataDir)
}

export function importOfflineVaultSnapshot(
  dataDir: string,
  snapshot: OfflineVaultSnapshot
): OfflineVaultSnapshot {
  const normalized = normalizeOfflineVaultSnapshot(snapshot)
  writeSnapshotFile(dataDir, normalized)
  return normalized
}

export function listOfflineVaultEntries(dataDir: string): OfflineVaultStoredEntry[] {
  return readSnapshotFile(dataDir).entries
}

export function createOfflineVaultEntry(
  dataDir: string,
  entry: Omit<OfflineVaultStoredEntry, 'id' | 'createTime' | 'updateTime'>
): OfflineVaultStoredEntry {
  return withSnapshot(dataDir, (snapshot) => {
    const now = new Date().toISOString()
    const created: OfflineVaultStoredEntry = {
      ...entry,
      id: generateOfflineSnowflakeId(),
      createTime: now,
      updateTime: now
    }
    snapshot.entries.push(created)
    return created
  })
}

export function updateOfflineVaultEntry(
  dataDir: string,
  id: string,
  entry: Omit<OfflineVaultStoredEntry, 'id' | 'createTime' | 'updateTime'>
): OfflineVaultStoredEntry | null {
  const entryId = toVaultEntryId(id)
  return withSnapshot(dataDir, (snapshot) => {
    const index = snapshot.entries.findIndex((item) => sameEntryId(item.id, entryId))
    if (index < 0) return null

    const existing = snapshot.entries[index]
    const updated: OfflineVaultStoredEntry = {
      ...entry,
      id: toVaultEntryId(existing.id),
      createTime: existing.createTime,
      updateTime: new Date().toISOString()
    }
    snapshot.entries[index] = updated
    return updated
  })
}

export function deleteOfflineVaultEntry(dataDir: string, id: string): boolean {
  const entryId = toVaultEntryId(id)
  return withSnapshot(dataDir, (snapshot) => {
    const before = snapshot.entries.length
    snapshot.entries = snapshot.entries.filter((item) => !sameEntryId(item.id, entryId))
    snapshot.favorites = snapshot.favorites.filter((item) => !sameEntryId(item.passwordId, entryId))
    snapshot.recentVisits = snapshot.recentVisits.filter((item) => !sameEntryId(item.passwordId, entryId))
    return snapshot.entries.length < before
  })
}

export function getOfflineVaultFavorites(dataDir: string): OfflineVaultRelationMeta[] {
  return readSnapshotFile(dataDir).favorites
}

export function addOfflineVaultFavorite(dataDir: string, passwordId: string): void {
  const id = toVaultEntryId(passwordId)
  withSnapshot(dataDir, (snapshot) => {
    const exists = snapshot.favorites.some((item) => sameEntryId(item.passwordId, id))
    if (exists) return snapshot

    snapshot.favorites.push({
      passwordId: id,
      time: new Date().toISOString()
    })
  })
}

export function removeOfflineVaultFavorite(dataDir: string, passwordId: string): void {
  const id = toVaultEntryId(passwordId)
  withSnapshot(dataDir, (snapshot) => {
    snapshot.favorites = snapshot.favorites.filter((item) => !sameEntryId(item.passwordId, id))
  })
}

export function getOfflineVaultRecentVisits(dataDir: string): OfflineVaultRelationMeta[] {
  return readSnapshotFile(dataDir).recentVisits
}

export function recordOfflineVaultRecentVisit(dataDir: string, passwordId: string): void {
  const id = toVaultEntryId(passwordId)
  withSnapshot(dataDir, (snapshot) => {
    const now = new Date().toISOString()
    const others = snapshot.recentVisits.filter((item) => !sameEntryId(item.passwordId, id))
    snapshot.recentVisits = [{ passwordId: id, time: now }, ...others].slice(0, 200)
  })
}

export function getOfflineVaultFavoriteIds(dataDir: string): string[] {
  return getOfflineVaultFavorites(dataDir).map((item) => toVaultEntryId(item.passwordId))
}

export function updateOfflineVaultEntryRaw(
  dataDir: string,
  id: string,
  data: Pick<OfflineVaultStoredEntry, 'passwordType' | 'content'>
): OfflineVaultStoredEntry | null {
  const entryId = toVaultEntryId(id)
  return withSnapshot(dataDir, (snapshot) => {
    const index = snapshot.entries.findIndex((item) => sameEntryId(item.id, entryId))
    if (index < 0) return null

    const existing = snapshot.entries[index]
    const updated: OfflineVaultStoredEntry = {
      ...existing,
      passwordType: data.passwordType,
      content: data.content,
      updateTime: new Date().toISOString()
    }
    snapshot.entries[index] = updated
    return updated
  })
}
