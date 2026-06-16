import type { PageResult, PasswordContent, PasswordEntry, PasswordEntryParams } from '@/types'
import {
  decryptContentObject,
  encryptContentObject,
  isEncryptedContent
} from '@/utils/contentCrypto'
import {
  buildPasswordEntryApiParams,
  enrichEntryFromContent,
  type PasswordEntryApiParams
} from '@/utils/contentMetadata'
import { SecurityKeyRequiredError } from '@/utils/securityKeyRequired'
import { useSecurityStore } from '@/stores/security'

export { SecurityKeyRequiredError }

function getPassphrase(): string | null {
  const key = useSecurityStore().securityKey?.trim()
  return key || null
}

export function isDecryptFailedContent(content: PasswordContent): boolean {
  return !!(content as Record<string, unknown>).__decryptFailed__
}

export async function decryptPasswordEntry(entry: PasswordEntry): Promise<PasswordEntry> {
  const passphrase = getPassphrase()
  if (!passphrase) {
    if (isEncryptedContent(entry.content)) {
      return {
        ...entry,
        content: {
          title: '内容已加密',
          __decryptFailed__: true
        },
        passwordLabels: [],
        remark: ''
      }
    }
    return enrichEntryFromContent(entry)
  }

  try {
    const content = await decryptContentObject(entry.content, passphrase)
    return enrichEntryFromContent({ ...entry, content })
  } catch {
    return {
      ...entry,
      content: {
        title: '解密失败，请检查安全密钥',
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
  const passphrase = getPassphrase()
  if (!passphrase) {
    throw new SecurityKeyRequiredError()
  }

  const apiParams = buildPasswordEntryApiParams(params)
  const content = await encryptContentObject(apiParams.content, passphrase)
  return {
    passwordType: apiParams.passwordType,
    content: content as unknown as PasswordContent
  }
}
