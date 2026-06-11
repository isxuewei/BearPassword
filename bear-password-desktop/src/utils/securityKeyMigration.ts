import type { PasswordContent, PasswordEntry } from '@/types'
import { fetchAllPasswordEntriesRaw, updatePasswordRawApi } from '@/api/vaultRaw'
import {
  decryptContentObject,
  encryptContentObject,
  isEncryptedContent
} from '@/utils/contentCrypto'
import {
  contentHasTitleField,
  extractTitleFromContent,
  resolveEntryTitle,
  stripTitleFromContent
} from '@/utils/passwordTitle'
import {
  needsWebsitesMigration,
  resolveMigrationWebsites,
  stripWebsitesFromContent
} from '@/utils/passwordWebsites'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

export interface SecurityKeyMigrationProgress {
  current: number
  total: number
  message: string
}

export type SecurityKeyMigrationProgressHandler = (progress: SecurityKeyMigrationProgress) => void

export class SecurityKeyMigrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecurityKeyMigrationError'
  }
}

interface PreparedMigrationItem {
  entry: PasswordEntry
  content: PasswordContent
  passwordTitle: string
  websites: string[]
}

async function decryptPlainContent(
  rawContent: PasswordContent,
  oldKey: string | null
): Promise<PasswordContent> {
  if (!isEncryptedContent(rawContent)) {
    return rawContent
  }
  if (!oldKey) {
    throw new SecurityKeyMigrationError('存在已加密条目，但缺少原密钥，无法迁移')
  }
  try {
    return await decryptContentObject(rawContent, oldKey)
  } catch {
    throw new SecurityKeyMigrationError('原密钥无法解密已有条目，请确认密钥正确')
  }
}

async function encryptPlainContent(
  plainContent: PasswordContent,
  newKey: string | null
): Promise<PasswordContent> {
  if (!newKey) {
    return plainContent
  }
  return (await encryptContentObject(plainContent, newKey)) as unknown as PasswordContent
}

function needsContentRewrite(
  rawContent: PasswordContent,
  oldKey: string | null,
  newKey: string | null
): boolean {
  const encrypted = isEncryptedContent(rawContent)
  if (newKey) {
    if (!encrypted) return true
    return !!oldKey
  }
  return encrypted && !!oldKey
}

function needsTitleMigration(entry: PasswordEntry, plainContent: PasswordContent): boolean {
  if (!entry.passwordTitle?.trim()) {
    return true
  }
  return contentHasTitleField(plainContent)
}

function stripLegacyFields(content: PasswordContent): PasswordContent {
  return stripWebsitesFromContent(stripTitleFromContent(content))
}

function getEntryMigrationLabel(entry: PasswordEntry): string {
  return resolveEntryTitle(entry) || `条目 #${entry.id}`
}

async function prepareEntryMigration(
  entry: PasswordEntry,
  oldKey: string | null,
  newKey: string | null
): Promise<PreparedMigrationItem | null> {
  const plainContent = await decryptPlainContent(entry.content, oldKey)
  const shouldRewrite = needsContentRewrite(entry.content, oldKey, newKey)
  const shouldExtractTitle = needsTitleMigration(entry, plainContent)
  const shouldExtractWebsites = needsWebsitesMigration(entry, plainContent)

  if (!shouldRewrite && !shouldExtractTitle && !shouldExtractWebsites) {
    return null
  }

  const entryType = resolveEntryType(entry)
  const plainRecord = plainContent as Record<string, unknown>
  const passwordTitle =
    entry.passwordTitle?.trim() || extractTitleFromContent(entryType, plainRecord)
  const websites = resolveMigrationWebsites(entry, entryType, plainRecord)
  const strippedContent = stripLegacyFields(plainContent)
  const content = await encryptPlainContent(strippedContent, newKey)

  return { entry, content, passwordTitle, websites }
}

/**
 * 迁移全部密码条目：更换密钥 + 提取 title/websites 到独立字段
 */
export async function migrateAllPasswordContents(
  oldKey: string | null,
  newKey: string | null,
  onProgress?: SecurityKeyMigrationProgressHandler
): Promise<number> {
  const entries = await fetchAllPasswordEntriesRaw()
  const total = entries.length

  onProgress?.({
    current: 0,
    total,
    message: total ? '正在校验条目…' : '暂无需要迁移的条目'
  })

  const prepared: PreparedMigrationItem[] = []

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    onProgress?.({
      current: index + 1,
      total,
      message: `正在校验 ${index + 1}/${total}：${getEntryMigrationLabel(entry)}`
    })

    const item = await prepareEntryMigration(entry, oldKey, newKey)
    if (item) {
      prepared.push(item)
    }
  }

  if (!prepared.length) {
    onProgress?.({
      current: total,
      total,
      message: '无需迁移'
    })
    return 0
  }

  for (let index = 0; index < prepared.length; index += 1) {
    const { entry, content, passwordTitle, websites } = prepared[index]
    onProgress?.({
      current: index + 1,
      total: prepared.length,
      message: `正在写入 ${index + 1}/${prepared.length}：${passwordTitle || getEntryMigrationLabel(entry)}`
    })

    await updatePasswordRawApi(entry.id, {
      passwordType: entry.passwordType,
      passwordLabels: [...entry.passwordLabels],
      passwordTitle,
      websites,
      content,
      remark: entry.remark ?? ''
    })
  }

  onProgress?.({
    current: prepared.length,
    total: prepared.length,
    message: `迁移完成，共处理 ${prepared.length} 条`
  })

  return prepared.length
}
