import { request } from '@/utils/request'
import type { PageResult, PasswordRelationMetaItem } from '@/types'
import type { PasswordEntry } from '@/types'
import { decryptPasswordPage } from '@/utils/vaultEntryTransform'
import {
  getOfflineRecentVisitMetaApi,
  recordOfflineRecentVisitApi,
  shouldUseOfflineVault
} from '@/api/offlineVaultLocal'

/** 分页查询最近访问条目 */
export async function getRecentVisitListApi(params: {
  page?: number
  pageSize?: number
  keyword?: string
} = {}): Promise<PageResult<PasswordEntry>> {
  const data = await request.get<PageResult<PasswordEntry>>('/recent-visits', { params })
  return decryptPasswordPage(data)
}

/** 获取最近访问元数据（密码 ID + 访问时间） */
export function getRecentVisitMetaApi(): Promise<PasswordRelationMetaItem[]> {
  if (shouldUseOfflineVault()) {
    return getOfflineRecentVisitMetaApi()
  }
  return request.get<PasswordRelationMetaItem[]>('/recent-visits/meta')
}

/** 记录一次最近访问（点击明细字段复制时调用） */
export function recordRecentVisitApi(passwordId: string): Promise<void> {
  if (shouldUseOfflineVault()) {
    return recordOfflineRecentVisitApi(passwordId)
  }
  return request.post<void>(`/recent-visits/${passwordId}`)
}
