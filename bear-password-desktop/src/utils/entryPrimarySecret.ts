import type { PasswordEntry } from '@/types'
import { normalizeDatabaseContent } from '@/utils/databaseContent'
import { normalizeLoginContent } from '@/utils/loginContent'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

/** 提取条目中可用于快捷复制的主密码/密钥字段 */
export function getEntryPrimarySecret(entry: PasswordEntry): string | null {
  if (isEncryptedContent(entry.content)) {
    return null
  }

  const content = entry.content as Record<string, unknown>
  const entryType = resolveEntryType(entry)

  switch (entryType) {
    case '登录信息':
    case '服务器': {
      const login = normalizeLoginContent(content)
      return login.password || null
    }
    case '数据库': {
      const database = normalizeDatabaseContent(content)
      return database.password || null
    }
    default:
      return null
  }
}
