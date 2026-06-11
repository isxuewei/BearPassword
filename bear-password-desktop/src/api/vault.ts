import { request } from '@/utils/request'
import type { PageResult } from '@/types'
import type { PasswordEntry, PasswordEntryParams, PasswordQueryParams } from '@/types'
import {
  decryptPasswordEntry,
  decryptPasswordPage,
  encryptPasswordEntryParams
} from '@/utils/vaultEntryTransform'

/**
 * 密码库 API
 */

/** 分页查询密码条目 */
export async function getPasswordListApi(
  params: PasswordQueryParams = {}
): Promise<PageResult<PasswordEntry>> {
  const data = await request.get<PageResult<PasswordEntry>>('/passwords', { params })
  return decryptPasswordPage(data)
}

/** 获取密码详情 */
export async function getPasswordDetailApi(id: number): Promise<PasswordEntry> {
  const entry = await request.get<PasswordEntry>(`/passwords/${id}`)
  return decryptPasswordEntry(entry)
}

/** 新增密码条目 */
export async function createPasswordApi(data: PasswordEntryParams): Promise<PasswordEntry> {
  const payload = await encryptPasswordEntryParams(data)
  const entry = await request.post<PasswordEntry>('/passwords', payload)
  return decryptPasswordEntry(entry)
}

/** 更新密码条目 */
export async function updatePasswordApi(
  id: number,
  data: PasswordEntryParams
): Promise<PasswordEntry> {
  const payload = await encryptPasswordEntryParams(data)
  const entry = await request.put<PasswordEntry>(`/passwords/${id}`, payload)
  return decryptPasswordEntry(entry)
}

/** 删除密码条目 */
export function deletePasswordApi(id: number): Promise<void> {
  return request.delete<void>(`/passwords/${id}`)
}

/** 获取当前用户已使用过的标签 */
export function getPasswordLabelsApi(): Promise<string[]> {
  return request.get<string[]>('/passwords/labels')
}
