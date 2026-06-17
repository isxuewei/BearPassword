import type { PasswordEntry, PasswordRelationMetaItem } from '@/types'
import type { PasswordEntryApiParams } from '@/utils/contentMetadata'
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
  return result.entry as PasswordEntry
}

export async function fetchOfflinePasswordEntriesRaw(): Promise<PasswordEntry[]> {
  assertOfflineApi()
  const entries = await window.offlineVaultApi!.listEntries()
  return entries as PasswordEntry[]
}

export async function createOfflinePasswordEntryRaw(
  data: PasswordEntryApiParams
): Promise<PasswordEntry> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.createEntry(data)
  return unwrapEntry(result)
}

export async function updateOfflinePasswordEntryRaw(
  id: number,
  data: PasswordEntryApiParams
): Promise<PasswordEntry> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.updateEntryRaw(id, data)
  return unwrapEntry(result)
}

export async function deleteOfflinePasswordEntry(id: number): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.deleteEntry(id)
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export function getOfflineFavoriteMetaApi(): Promise<PasswordRelationMetaItem[]> {
  assertOfflineApi()
  return window.offlineVaultApi!.getFavoritesMeta() as Promise<PasswordRelationMetaItem[]>
}

export function getOfflineFavoriteIdsApi(): Promise<number[]> {
  assertOfflineApi()
  return window.offlineVaultApi!.getFavoriteIds()
}

export async function addOfflineFavoriteApi(passwordId: number): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.addFavorite(passwordId)
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export async function removeOfflineFavoriteApi(passwordId: number): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.removeFavorite(passwordId)
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export function getOfflineRecentVisitMetaApi(): Promise<PasswordRelationMetaItem[]> {
  assertOfflineApi()
  return window.offlineVaultApi!.getRecentMeta() as Promise<PasswordRelationMetaItem[]>
}

export async function recordOfflineRecentVisitApi(passwordId: number): Promise<void> {
  assertOfflineApi()
  const result = await window.offlineVaultApi!.recordRecent(passwordId)
  if (!result.ok) {
    throw new Error(result.error)
  }
}

export function shouldUseOfflineVault(): boolean {
  return isOfflineVaultMode() && isOfflineVaultApiAvailable()
}
