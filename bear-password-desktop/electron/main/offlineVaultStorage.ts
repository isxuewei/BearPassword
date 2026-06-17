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
      id: snapshot.nextId,
      createTime: now,
      updateTime: now
    }
    snapshot.nextId += 1
    snapshot.entries.push(created)
    return created
  })
}

export function updateOfflineVaultEntry(
  dataDir: string,
  id: number,
  entry: Omit<OfflineVaultStoredEntry, 'id' | 'createTime' | 'updateTime'>
): OfflineVaultStoredEntry | null {
  return withSnapshot(dataDir, (snapshot) => {
    const index = snapshot.entries.findIndex((item) => item.id === id)
    if (index < 0) return null

    const existing = snapshot.entries[index]
    const updated: OfflineVaultStoredEntry = {
      ...entry,
      id,
      createTime: existing.createTime,
      updateTime: new Date().toISOString()
    }
    snapshot.entries[index] = updated
    return updated
  })
}

export function deleteOfflineVaultEntry(dataDir: string, id: number): boolean {
  return withSnapshot(dataDir, (snapshot) => {
    const before = snapshot.entries.length
    snapshot.entries = snapshot.entries.filter((item) => item.id !== id)
    snapshot.favorites = snapshot.favorites.filter((item) => item.passwordId !== id)
    snapshot.recentVisits = snapshot.recentVisits.filter((item) => item.passwordId !== id)
    return snapshot.entries.length < before
  })
}

export function getOfflineVaultFavorites(dataDir: string): OfflineVaultRelationMeta[] {
  return readSnapshotFile(dataDir).favorites
}

export function addOfflineVaultFavorite(dataDir: string, passwordId: number): void {
  withSnapshot(dataDir, (snapshot) => {
    const exists = snapshot.favorites.some((item) => item.passwordId === passwordId)
    if (exists) return snapshot

    snapshot.favorites.push({
      passwordId,
      time: new Date().toISOString()
    })
  })
}

export function removeOfflineVaultFavorite(dataDir: string, passwordId: number): void {
  withSnapshot(dataDir, (snapshot) => {
    snapshot.favorites = snapshot.favorites.filter((item) => item.passwordId !== passwordId)
  })
}

export function getOfflineVaultRecentVisits(dataDir: string): OfflineVaultRelationMeta[] {
  return readSnapshotFile(dataDir).recentVisits
}

export function recordOfflineVaultRecentVisit(dataDir: string, passwordId: number): void {
  withSnapshot(dataDir, (snapshot) => {
    const now = new Date().toISOString()
    const others = snapshot.recentVisits.filter((item) => item.passwordId !== passwordId)
    snapshot.recentVisits = [{ passwordId, time: now }, ...others].slice(0, 200)
  })
}

export function getOfflineVaultFavoriteIds(dataDir: string): number[] {
  return getOfflineVaultFavorites(dataDir).map((item) => item.passwordId)
}

export function updateOfflineVaultEntryRaw(
  dataDir: string,
  id: number,
  data: Pick<OfflineVaultStoredEntry, 'passwordType' | 'content'>
): OfflineVaultStoredEntry | null {
  return withSnapshot(dataDir, (snapshot) => {
    const index = snapshot.entries.findIndex((item) => item.id === id)
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
