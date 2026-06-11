import { request } from '@/utils/request'
import type { PageResult } from '@/types'
import type { PasswordEntry } from '@/types'
import { decryptPasswordPage } from '@/utils/vaultEntryTransform'

/** 分页查询收藏条目 */
export async function getFavoriteListApi(params: {
  page?: number
  pageSize?: number
  keyword?: string
} = {}): Promise<PageResult<PasswordEntry>> {
  const data = await request.get<PageResult<PasswordEntry>>('/favorites', { params })
  return decryptPasswordPage(data)
}

/** 获取已收藏的 password ID 列表 */
export function getFavoriteIdsApi(): Promise<number[]> {
  return request.get<number[]>('/favorites/ids')
}

/** 添加收藏 */
export function addFavoriteApi(passwordId: number): Promise<void> {
  return request.post<void>(`/favorites/${passwordId}`)
}

/** 取消收藏 */
export function removeFavoriteApi(passwordId: number): Promise<void> {
  return request.delete<void>(`/favorites/${passwordId}`)
}
