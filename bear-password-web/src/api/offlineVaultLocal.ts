/** Web 端离线保险库占位（始终走在线 API） */
import type { PasswordEntry } from '@/types'
import type { PasswordRelationMetaItem } from '@/types'

export function shouldUseOfflineVault(): boolean {
  return false
}

export async function getOfflineFavoriteMetaApi(): Promise<PasswordRelationMetaItem[]> {
  throw new Error('Web 端不支持离线保险库')
}

export async function getOfflineFavoriteIdsApi(): Promise<string[]> {
  throw new Error('Web 端不支持离线保险库')
}

export async function addOfflineFavoriteApi(_id: string): Promise<void> {
  throw new Error('Web 端不支持离线保险库')
}

export async function removeOfflineFavoriteApi(_id: string): Promise<void> {
  throw new Error('Web 端不支持离线保险库')
}

export async function getOfflineRecentVisitMetaApi(): Promise<PasswordRelationMetaItem[]> {
  throw new Error('Web 端不支持离线保险库')
}

export async function recordOfflineRecentVisitApi(_id: string): Promise<void> {
  throw new Error('Web 端不支持离线保险库')
}

export async function fetchOfflinePasswordEntriesRaw(): Promise<PasswordEntry[]> {
  throw new Error('Web 端不支持离线保险库')
}

export async function createOfflinePasswordEntryRaw(_entry: unknown): Promise<PasswordEntry> {
  throw new Error('Web 端不支持离线保险库')
}

export async function updateOfflinePasswordEntryRaw(
  _id: string,
  _entry: unknown
): Promise<PasswordEntry> {
  throw new Error('Web 端不支持离线保险库')
}

export async function deleteOfflinePasswordEntry(_id: string): Promise<void> {
  throw new Error('Web 端不支持离线保险库')
}
