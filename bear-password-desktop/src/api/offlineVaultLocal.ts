import type { PasswordEntry, PasswordRelationMetaItem } from '@/types'
import type { PasswordEntryApiParams } from '@/utils/contentMetadata'
import { toVaultEntryId, type VaultEntryId } from '../../shared/vaultEntryId'
import { isOfflineVaultApiAvailable, isOfflineVaultMode } from '@/utils/offlineVaultMode'

function assertOfflineApi(): void {
  if (!isOfflineVaultApiAvailable()) {
    throw new Error('离线存储不可用')
  }
}

function unwrapEntry(result: { ok: true; entry: unknown } | { ok: false; error: string }): PasswordEntry {
  if (!result.ok) {
    throw new Error(result.error)
  }
  const entry = result.entry as PasswordEntry
  return { ...entry, id: toVaultEntryId(entry.id) }
}

export async function fetchOfflinePasswordEntriesRaw(): Promise<PasswordEntry[]> {
  assertOfflineApi()
  const entries = await window.offlineVaultApi!.listEntries()
  return (entries as PasswordEntry[]).map((entry) => ({
    ...entry,
    id: toVaultEntryId(entry.id)
  }))
}

export async function createOfflinePasswordEntryRaw(
  data: PasswordEntryApiParams
): Promise<PasswordEntry> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.createEntry(data)
  return unwrapEntry(result)
}

export async function updateOfflinePasswordEntryRaw(
  id: VaultEntryId,
  data: PasswordEntryApiParams
): Promise<PasswordEntry> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.updateEntryRaw(toVaultEntryId(id), data)
  return unwrapEntry(result)
}

export async function deleteOfflinePasswordEntry(id: VaultEntryId): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.deleteEntry(toVaultEntryId(id))
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export function getOfflineFavoriteMetaApi(): Promise<PasswordRelationMetaItem[]> {
  assertOfflineApi()
  return window.offlineVaultApi!.getFavoritesMeta() as Promise<PasswordRelationMetaItem[]>
}

export function getOfflineFavoriteIdsApi(): Promise<VaultEntryId[]> {
  assertOfflineApi()
  return window.offlineVaultApi!.getFavoriteIds().then((ids) => ids.map((id) => toVaultEntryId(id)))
}

export async function addOfflineFavoriteApi(passwordId: VaultEntryId): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.addFavorite(toVaultEntryId(passwordId))
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export async function removeOfflineFavoriteApi(passwordId: VaultEntryId): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.removeFavorite(toVaultEntryId(passwordId))
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export function getOfflineRecentVisitMetaApi(): Promise<PasswordRelationMetaItem[]> {
  assertOfflineApi()
  return window.offlineVaultApi!.getRecentMeta() as Promise<PasswordRelationMetaItem[]>
}

export async function recordOfflineRecentVisitApi(passwordId: VaultEntryId): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.recordRecent(toVaultEntryId(passwordId))
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export function shouldUseOfflineVault(): boolean {
  return isOfflineVaultMode() && isOfflineVaultApiAvailable()
}
