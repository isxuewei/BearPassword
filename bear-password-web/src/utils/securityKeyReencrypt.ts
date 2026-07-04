import type { PasswordContent, PasswordEntry } from '@/types'
import { fetchAllPasswordEntriesRaw, updatePasswordRawApi } from '@/api/vaultRaw'
import {
  decryptContentObject,
  encryptContentObject,
  isEncryptedContent,
  type VaultUnlockContext
} from '@/utils/contentCrypto'

export interface SecurityKeyReencryptProgress {
  current: number
  total: number
  message: string
}

export type SecurityKeyReencryptProgressHandler = (progress: SecurityKeyReencryptProgress) => void

export class SecurityKeyReencryptError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SecurityKeyReencryptError'
  }
}

interface PreparedReencryptItem {
  entry: PasswordEntry
  content: PasswordContent
}

async function decryptPlainContent(
  rawContent: PasswordContent,
  oldUnlock: VaultUnlockContext | null,
  newUnlock: VaultUnlockContext | null
): Promise<PasswordContent> {
  if (!isEncryptedContent(rawContent)) {
    return rawContent
  }
  const unlock = oldUnlock ?? newUnlock
  if (!unlock) {
    throw new SecurityKeyReencryptError('存在已加密条目，但缺少密钥，无法处理')
  }
  try {
    return await decryptContentObject(rawContent, unlock)
  } catch {
    throw new SecurityKeyReencryptError(
      oldUnlock
        ? '原密钥无法解密已有条目，请确认密钥正确'
        : '账户密钥无法解密已有条目，请确认与之前使用的密钥完全一致'
    )
  }
}

async function encryptPlainContent(
  plainContent: PasswordContent,
  unlock: VaultUnlockContext | null
): Promise<PasswordContent> {
  if (!unlock) {
    return plainContent
  }
  return (await encryptContentObject(plainContent, unlock)) as unknown as PasswordContent
}

function needsContentRewrite(
  rawContent: PasswordContent,
  oldUnlock: VaultUnlockContext | null,
  newUnlock: VaultUnlockContext | null
): boolean {
  const encrypted = isEncryptedContent(rawContent)
  if (newUnlock) {
    if (!encrypted) return true
    return !!oldUnlock
  }
  return encrypted && !!oldUnlock
}

async function prepareEntryReencrypt(
  entry: PasswordEntry,
  oldUnlock: VaultUnlockContext | null,
  newUnlock: VaultUnlockContext | null
): Promise<PreparedReencryptItem | null> {
  const plainContent = await decryptPlainContent(entry.content, oldUnlock, newUnlock)
  if (!needsContentRewrite(entry.content, oldUnlock, newUnlock)) {
    return null
  }

  const content = await encryptPlainContent(plainContent, newUnlock)
  return { entry, content }
}

/** 更换账户密钥时，将全部条目的 content 用新上下文重新加密 */
export async function reencryptAllPasswordContents(
  oldUnlock: VaultUnlockContext | null,
  newUnlock: VaultUnlockContext | null,
  onProgress?: SecurityKeyReencryptProgressHandler
): Promise<number> {
  if (!newUnlock?.vuk) {
    throw new SecurityKeyReencryptError('必须配置账户密钥，不允许清除加密或上传明文')
  }

  const entries = await fetchAllPasswordEntriesRaw()
  const total = entries.length

  onProgress?.({
    current: 0,
    total,
    message: total ? '正在校验条目…' : '暂无需要重新加密的条目'
  })

  const prepared: PreparedReencryptItem[] = []

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    onProgress?.({
      current: index + 1,
      total,
      message: `正在校验 ${index + 1}/${total}：条目 #${entry.id}`
    })

    const item = await prepareEntryReencrypt(entry, oldUnlock, newUnlock)
    if (item) {
      prepared.push(item)
    }
  }

  if (!prepared.length) {
    onProgress?.({
      current: total,
      total,
      message: '无需重新加密'
    })
    return 0
  }

  for (let index = 0; index < prepared.length; index += 1) {
    const { entry, content } = prepared[index]
    onProgress?.({
      current: index + 1,
      total: prepared.length,
      message: `正在重新加密 ${index + 1}/${prepared.length}：条目 #${entry.id}`
    })

    await updatePasswordRawApi(entry.id, {
      passwordType: entry.passwordType,
      content
    })
  }

  onProgress?.({
    current: prepared.length,
    total: prepared.length,
    message: `重新加密完成，共处理 ${prepared.length} 条`
  })

  return prepared.length
}
