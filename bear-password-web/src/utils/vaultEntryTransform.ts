import type { PageResult, PasswordContent, PasswordEntry, PasswordEntryParams } from '@/types'
import { toVaultEntryId } from '../../shared/vaultEntryId'
import {
  decryptContentObject,
  encryptContentObject,
  isEncryptedContent,
  type VaultUnlockContext
} from '@/utils/contentCrypto'
import {
  buildPasswordEntryApiParams,
  enrichEntryFromContent,
  type PasswordEntryApiParams
} from '@/utils/contentMetadata'
import { SecurityKeyRequiredError } from '@/utils/securityKeyRequired'
import { useSecurityStore } from '@/stores/security'

export { SecurityKeyRequiredError }

function getUnlockContext(): VaultUnlockContext | null {
  return useSecurityStore().getUnlockContext()
}

export function isDecryptFailedContent(content: PasswordContent): boolean {
  return !!(content as Record<string, unknown>).__decryptFailed__
}

export async function decryptPasswordEntry(entry: PasswordEntry): Promise<PasswordEntry> {
  const normalized: PasswordEntry = { ...entry, id: toVaultEntryId(entry.id) }
  const unlock = getUnlockContext()
  if (!unlock) {
    if (isEncryptedContent(normalized.content)) {
      return {
        ...normalized,
        content: {
          title: '内容已加密',
          __decryptFailed__: true
        },
        passwordLabels: [],
        remark: ''
      }
    }
    return enrichEntryFromContent(normalized)
  }

  try {
    const content = await decryptContentObject(normalized.content, unlock)
    return enrichEntryFromContent({ ...normalized, content })
  } catch {
    return {
      ...normalized,
      content: {
        title: '解密失败，请检查主密码与账户密钥',
        __decryptFailed__: true
      },
      passwordLabels: [],
      remark: ''
    }
  }
}

export async function decryptPasswordEntries(entries: PasswordEntry[]): Promise<PasswordEntry[]> {
  return Promise.all(entries.map((entry) => decryptPasswordEntry(entry)))
}

export async function decryptPasswordPage(
  result: PageResult<PasswordEntry>
): Promise<PageResult<PasswordEntry>> {
  return {
    ...result,
    list: await decryptPasswordEntries(result.list)
  }
}

export async function encryptPasswordEntryParams(
  params: PasswordEntryParams
): Promise<PasswordEntryApiParams> {
  const unlock = getUnlockContext()
  if (!unlock) {
    throw new SecurityKeyRequiredError()
  }

  const apiParams = buildPasswordEntryApiParams(params)
  const content = await encryptContentObject(apiParams.content, unlock)
  return {
    passwordType: apiParams.passwordType,
    content: content as unknown as PasswordContent
  }
}
