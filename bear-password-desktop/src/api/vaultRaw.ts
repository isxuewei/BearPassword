import { request } from '@/utils/request'
import type { PageResult } from '@/types'
import type { PasswordEntry, PasswordEntryParams, PasswordQueryParams } from '@/types'

/**
 * 密码库原始 API（不做客户端加解密，供密钥迁移使用）
 */

export function getPasswordListRawApi(
  params: PasswordQueryParams = {}
): Promise<PageResult<PasswordEntry>> {
  return request.get<PageResult<PasswordEntry>>('/passwords', { params })
}

export function updatePasswordRawApi(
  id: number,
  data: PasswordEntryParams
): Promise<PasswordEntry> {
  return request.put<PasswordEntry>(`/passwords/${id}`, data)
}

/** 拉取当前用户全部密码条目（原始 content） */
export async function fetchAllPasswordEntriesRaw(): Promise<PasswordEntry[]> {
  const pageSize = 50
  let page = 1
  const all: PasswordEntry[] = []

  while (true) {
    const data = await getPasswordListRawApi({ page, pageSize })
    all.push(...data.list)
    if (all.length >= data.total || data.list.length === 0) {
      break
    }
    page += 1
  }

  return all
}
