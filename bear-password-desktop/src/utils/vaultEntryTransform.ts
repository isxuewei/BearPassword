import type { PageResult, PasswordContent, PasswordEntry, PasswordEntryParams } from '@/types'
import {
  decryptContentObject,
  encryptContentObject,
  isEncryptedContent
} from '@/utils/contentCrypto'
import { useSecurityStore } from '@/stores/security'

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
        }
      }
    }
    return entry
  }

  try {
    const content = await decryptContentObject(entry.content, passphrase)
    return { ...entry, content }
  } catch {
    return {
      ...entry,
      content: {
        title: '解密失败，请检查安全密钥',
        __decryptFailed__: true
      }
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
): Promise<PasswordEntryParams> {
  const passphrase = getPassphrase()
  if (!passphrase) {
    return params
  }

  const content = await encryptContentObject(params.content, passphrase)
  return {
    ...params,
    content: content as unknown as PasswordContent
  }
}
