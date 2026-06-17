import { request } from '@/utils/request'
import type { PageResult } from '@/types'
import type { PasswordEntry, PasswordEntryParams, PasswordQueryParams } from '@/types'
import { fetchAllPages } from '@/utils/fetchAllPages'
import { fetchAllPasswordEntriesRaw } from '@/api/vaultRaw'
import {
  createOfflinePasswordEntryRaw,
  deleteOfflinePasswordEntry,
  fetchOfflinePasswordEntriesRaw,
  shouldUseOfflineVault,
  updateOfflinePasswordEntryRaw
} from '@/api/offlineVaultLocal'
import {
  decryptPasswordEntries,
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

/** 拉取当前用户全部密码条目并本地解密 */
export async function fetchAllPasswordEntries(): Promise<PasswordEntry[]> {
  const raw = shouldUseOfflineVault()
    ? await fetchOfflinePasswordEntriesRaw()
    : await fetchAllPasswordEntriesRaw()
  return decryptPasswordEntries(raw)
}

/** 获取密码详情 */
export async function getPasswordDetailApi(id: number): Promise<PasswordEntry> {
  if (shouldUseOfflineVault()) {
    const raw = await fetchOfflinePasswordEntriesRaw()
    const entry = raw.find((item) => item.id === id)
    if (!entry) {
      throw new Error('密码条目不存在')
    }
    return decryptPasswordEntry(entry)
  }

  const entry = await request.get<PasswordEntry>(`/passwords/${id}`)
  return decryptPasswordEntry(entry)
}

/** 新增密码条目 */
export async function createPasswordApi(data: PasswordEntryParams): Promise<PasswordEntry> {
  const payload = await encryptPasswordEntryParams(data)
  if (shouldUseOfflineVault()) {
    const entry = await createOfflinePasswordEntryRaw(payload)
    return decryptPasswordEntry(entry)
  }

  const entry = await request.post<PasswordEntry>('/passwords', payload)
  return decryptPasswordEntry(entry)
}

/** 更新密码条目 */
export async function updatePasswordApi(
  id: number,
  data: PasswordEntryParams
): Promise<PasswordEntry> {
  const payload = await encryptPasswordEntryParams(data)
  if (shouldUseOfflineVault()) {
    const entry = await updateOfflinePasswordEntryRaw(id, payload)
    return decryptPasswordEntry(entry)
  }

  const entry = await request.put<PasswordEntry>(`/passwords/${id}`, payload)
  return decryptPasswordEntry(entry)
}

/** 删除密码条目 */
export async function deletePasswordApi(id: number): Promise<void> {
  if (shouldUseOfflineVault()) {
    await deleteOfflinePasswordEntry(id)
    return
  }

  return request.delete<void>(`/passwords/${id}`)
}

/** 获取当前用户已使用过的标签 */
export async function getPasswordLabelsApi(): Promise<string[]> {
  if (shouldUseOfflineVault()) {
    const entries = await fetchAllPasswordEntries()
    const labels = new Set<string>()
    entries.forEach((entry) => {
      entry.passwordLabels?.forEach((label) => {
        if (label.trim()) labels.add(label.trim())
      })
    })
    return [...labels].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }

  return request.get<string[]>('/passwords/labels')
}
