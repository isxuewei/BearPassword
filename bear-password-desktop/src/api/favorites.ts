import { request } from '@/utils/request'
import type { PageResult, PasswordRelationMetaItem } from '@/types'
import type { PasswordEntry } from '@/types'
import { toVaultEntryId, type VaultEntryId } from '../../shared/vaultEntryId'
import { decryptPasswordPage } from '@/utils/vaultEntryTransform'
import {
  addOfflineFavoriteApi,
  getOfflineFavoriteIdsApi,
  getOfflineFavoriteMetaApi,
  removeOfflineFavoriteApi,
  shouldUseOfflineVault
} from '@/api/offlineVaultLocal'

/** 分页查询收藏条目 */
export async function getFavoriteListApi(params: {
  page?: number
  pageSize?: number
  keyword?: string
} = {}): Promise<PageResult<PasswordEntry>> {
  const data = await request.get<PageResult<PasswordEntry>>('/favorites', { params })
  return decryptPasswordPage(data)
}

/** 获取收藏元数据（密码 ID + 收藏时间） */
export function getFavoriteMetaApi(): Promise<PasswordRelationMetaItem[]> {
  if (shouldUseOfflineVault()) {
    return getOfflineFavoriteMetaApi()
  }
  return request.get<PasswordRelationMetaItem[]>('/favorites/meta')
}

/** 获取已收藏的 password ID 列表 */
export function getFavoriteIdsApi(): Promise<VaultEntryId[]> {
  if (shouldUseOfflineVault()) {
    return getOfflineFavoriteIdsApi()
  }
  return request.get<VaultEntryId[]>('/favorites/ids')
}

/** 添加收藏 */
export function addFavoriteApi(passwordId: VaultEntryId): Promise<void> {
  const id = toVaultEntryId(passwordId)
  if (shouldUseOfflineVault()) {
    return addOfflineFavoriteApi(id)
  }
  return request.post<void>(`/favorites/${id}`)
}

/** 取消收藏 */
export function removeFavoriteApi(passwordId: VaultEntryId): Promise<void> {
  const id = toVaultEntryId(passwordId)
  if (shouldUseOfflineVault()) {
    return removeOfflineFavoriteApi(id)
  }
  return request.delete<void>(`/favorites/${id}`)
}
