import { request } from '@/utils/request'
import type { PageResult } from '@/types'
import type { PasswordEntry } from '@/types'
import { decryptPasswordPage } from '@/utils/vaultEntryTransform'

/** 分页查询最近访问条目 */
export async function getRecentVisitListApi(params: {
  page?: number
  pageSize?: number
  keyword?: string
} = {}): Promise<PageResult<PasswordEntry>> {
  const data = await request.get<PageResult<PasswordEntry>>('/recent-visits', { params })
  return decryptPasswordPage(data)
}

/** 记录一次最近访问（点击明细字段复制时调用） */
export function recordRecentVisitApi(passwordId: number): Promise<void> {
  return request.post<void>(`/recent-visits/${passwordId}`)
}
