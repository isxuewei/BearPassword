import { request } from '@/utils/request'
import type { PageResult, PasswordRelationMetaItem } from '@/types'
import type { PasswordEntry } from '@/types'
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
export function getFavoriteIdsApi(): Promise<number[]> {
  if (shouldUseOfflineVault()) {
    return getOfflineFavoriteIdsApi()
  }
  return request.get<number[]>('/favorites/ids')
}

/** 添加收藏 */
export function addFavoriteApi(passwordId: number): Promise<void> {
  if (shouldUseOfflineVault()) {
    return addOfflineFavoriteApi(passwordId)
  }
  return request.post<void>(`/favorites/${passwordId}`)
}

/** 取消收藏 */
export function removeFavoriteApi(passwordId: number): Promise<void> {
  if (shouldUseOfflineVault()) {
    return removeOfflineFavoriteApi(passwordId)
  }
  return request.delete<void>(`/favorites/${passwordId}`)
}
