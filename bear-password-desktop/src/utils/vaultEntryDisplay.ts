import type { PasswordEntry, PasswordType } from '@/types'
import { isLegacyDatabaseCustomEntry } from '@/utils/databaseContent'
import { isServerLoginContent } from '@/utils/loginContent'

export type VaultEntryIconType =
  | '登录信息'
  | '安全备注'
  | '银行卡'
  | '身份标识'
  | '服务器'
  | '数据库'
  | '自定义'

export function resolveEntryType(entry: PasswordEntry): PasswordType {
  const data = entry.content as Record<string, unknown>
  if (isLegacyDatabaseCustomEntry(entry.passwordType, data)) {
    return '数据库'
  }
  if (entry.passwordType === '服务器') {
    return '服务器'
  }
  if (entry.passwordType === '登录信息' && isServerLoginContent(data)) {
    return '服务器'
  }
  return entry.passwordType
}

export function getEntryIconType(entry: PasswordEntry): VaultEntryIconType {
  const type = resolveEntryType(entry)
  if (type === '服务器') return '服务器'
  if (type === '身份信息') return '身份标识'
  if (type === '数据库') return '数据库'
  if (type === '自定义') return '自定义'
  if (type === '登录信息') return '登录信息'
  if (type === '安全备注') return '安全备注'
  if (type === '银行卡') return '银行卡'
  return '自定义'
}

export function getEntryTypeColor(entry: PasswordEntry): string {
  return getPasswordTypeColor(getEntryIconType(entry))
}

export function getPasswordTypeIconType(type: PasswordType): VaultEntryIconType {
  if (type === '身份信息') return '身份标识'
  if (type === '服务器') return '服务器'
  if (type === '数据库') return '数据库'
  if (type === '自定义') return '自定义'
  if (type === '登录信息') return '登录信息'
  if (type === '安全备注') return '安全备注'
  if (type === '银行卡') return '银行卡'
  return '自定义'
}

export function getPasswordTypeColor(type: PasswordType): string {
  const colorMap: Record<VaultEntryIconType, string> = {
    登录信息: '#2ec4b6',
    安全备注: '#f4a261',
    银行卡: '#4ea8de',
    身份标识: '#06d6a0',
    服务器: '#1b998b',
    数据库: '#5e60ce',
    自定义: '#9b5de5'
  }
  return colorMap[getPasswordTypeIconType(type)]
}
