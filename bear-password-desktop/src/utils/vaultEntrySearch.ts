import type { PasswordEntry, PasswordType } from '@/types'
import { isEncryptedContent } from '@/utils/contentCrypto'
import { resolveEntryTitle } from '@/utils/passwordTitle'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

function collectStrings(value: unknown, out: string[]): void {
  if (value == null) return
  if (typeof value === 'string') {
    const text = value.trim()
    if (text) out.push(text)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
    return
  }
  if (typeof value === 'object') {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      collectStrings(nested, out)
    }
  }
}

/** 本地关键词匹配（解密后的 title、标签、备注、content 等） */
export function matchesVaultKeyword(entry: PasswordEntry, keyword: string): boolean {
  const query = keyword.trim().toLowerCase()
  if (!query) return true

  const parts: string[] = []
  parts.push(resolveEntryTitle(entry))

  if (entry.remark?.trim()) parts.push(entry.remark.trim())
  if (entry.passwordLabels?.length) parts.push(...entry.passwordLabels)
  if (entry.websites?.length) parts.push(...entry.websites)

  const entryType = resolveEntryType(entry)
  parts.push(entryType)
  if (entry.passwordType) parts.push(entry.passwordType)

  if (!isEncryptedContent(entry.content)) {
    collectStrings(entry.content, parts)
  }

  return parts.join('\n').toLowerCase().includes(query)
}

export function filterVaultEntries(
  entries: PasswordEntry[],
  options: { keyword?: string; passwordType?: PasswordType | '' } = {}
): PasswordEntry[] {
  const keyword = options.keyword?.trim() ?? ''
  const passwordType = options.passwordType ?? ''

  return entries.filter((entry) => {
    if (passwordType && resolveEntryType(entry) !== passwordType) return false
    return matchesVaultKeyword(entry, keyword)
  })
}
