import type { PageResult, PasswordEntry, PasswordEntryParams, PasswordQueryParams } from '@/shared/types'
import { http } from '@/shared/utils/request'
import { decryptContentObject, isEncryptedContent } from '@/shared/utils/contentCrypto'
import { decryptPasswordEntry, encryptPasswordEntryParams } from '@/shared/utils/vaultTransform'

export async function getPasswordListRawApi(
  origin: string,
  token: string,
  params: PasswordQueryParams = {}
): Promise<PageResult<PasswordEntry>> {
  return http.get<PageResult<PasswordEntry>>('/passwords', {
    origin,
    token,
    params: params as Record<string, string | number | undefined>
  })
}

/** 校验安全密钥能否解密已加密条目 */
export async function validateSecurityKeyApi(
  origin: string,
  token: string,
  securityKey: string
): Promise<{ encryptedTotal: number; verified: boolean }> {
  const data = await getPasswordListRawApi(origin, token, {
    page: 1,
    pageSize: 200,
    passwordType: '登录信息'
  })
  const encrypted = data.list.filter((entry) => isEncryptedContent(entry.content))
  if (!encrypted.length) {
    return { encryptedTotal: 0, verified: true }
  }

  const samples = encrypted.slice(0, 5)
  for (const entry of samples) {
    try {
      await decryptContentObject(entry.content, securityKey)
    } catch {
      return { encryptedTotal: encrypted.length, verified: false }
    }
  }
  return { encryptedTotal: encrypted.length, verified: true }
}

export async function getPasswordListApi(
  origin: string,
  token: string,
  securityKey: string | null,
  params: PasswordQueryParams = {}
): Promise<PageResult<PasswordEntry>> {
  const data = await getPasswordListRawApi(origin, token, params)
  const list = await Promise.all(data.list.map((entry) => decryptPasswordEntry(entry, securityKey)))
  return { ...data, list }
}

export function deletePasswordApi(origin: string, token: string, id: number): Promise<void> {
  return http.delete<void>(`/passwords/${id}`, { origin, token })
}

export async function getPasswordDetailApi(
  origin: string,
  token: string,
  securityKey: string | null,
  id: number
): Promise<PasswordEntry> {
  const entry = await http.get<PasswordEntry>(`/passwords/${id}`, { origin, token })
  return decryptPasswordEntry(entry, securityKey)
}

export async function createPasswordApi(
  origin: string,
  token: string,
  securityKey: string | null,
  data: PasswordEntryParams
): Promise<PasswordEntry> {
  const payload = await encryptPasswordEntryParams(data, securityKey)
  const entry = await http.post<PasswordEntry>('/passwords', payload, { origin, token })
  return decryptPasswordEntry(entry, securityKey)
}

export async function updatePasswordApi(
  origin: string,
  token: string,
  securityKey: string | null,
  id: number,
  data: PasswordEntryParams
): Promise<PasswordEntry> {
  const payload = await encryptPasswordEntryParams(data, securityKey)
  const entry = await http.put<PasswordEntry>(`/passwords/${id}`, payload, { origin, token })
  return decryptPasswordEntry(entry, securityKey)
}
