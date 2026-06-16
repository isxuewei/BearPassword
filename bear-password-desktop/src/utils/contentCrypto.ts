/**
 * 密码条目 content 客户端加解密（v2：VUK + 每条目 itemSalt）
 */
import type { PasswordContent } from '@/types'
import { CRYPTO_VERSION_V2 } from '@/utils/vaultCrypto/constants'
import { fromBase64, toBase64 } from '@/utils/vaultCrypto/encoding'
import {
  deriveItemAesKey,
  generateAccountSecretKey,
  isValidAccountSecretKeyLength
} from '@/utils/vaultCrypto/vaultKeyDerivation'

export const ENCRYPTED_CONTENT_MARKER = '__encrypted__'

export interface EncryptedContentEnvelope {
  [ENCRYPTED_CONTENT_MARKER]: true
  v: number
  iv: string
  data: string
  itemSalt: string
}

export interface VaultUnlockContext {
  vuk: Uint8Array
}

/** @deprecated 使用 ACCOUNT_SECRET_KEY_LENGTH */
export const SECURITY_KEY_LENGTH = 128

export function isValidSecurityKeyLength(key: string): boolean {
  return isValidAccountSecretKeyLength(key)
}

/** @deprecated 使用 generateAccountSecretKey */
export function generateSecurityKey(): string {
  return generateAccountSecretKey()
}

export { generateAccountSecretKey, isValidAccountSecretKeyLength }

export function isEncryptedContent(content: unknown): content is EncryptedContentEnvelope {
  if (!content || typeof content !== 'object') return false
  const record = content as Record<string, unknown>
  return (
    record[ENCRYPTED_CONTENT_MARKER] === true &&
    typeof record.iv === 'string' &&
    typeof record.data === 'string'
  )
}

export async function encryptContentObject(
  content: PasswordContent,
  unlock: VaultUnlockContext
): Promise<EncryptedContentEnvelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(content))
  const itemSalt = toBase64(crypto.getRandomValues(new Uint8Array(16)))
  const key = await deriveItemAesKey(unlock.vuk, itemSalt)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return {
    [ENCRYPTED_CONTENT_MARKER]: true,
    v: CRYPTO_VERSION_V2,
    itemSalt,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext))
  }
}

export async function decryptContentObject(
  content: PasswordContent,
  unlock: VaultUnlockContext
): Promise<PasswordContent> {
  if (!isEncryptedContent(content)) {
    return content
  }

  if (content.v !== CRYPTO_VERSION_V2 || typeof content.itemSalt !== 'string') {
    throw new Error('不支持的加密格式')
  }

  const key = await deriveItemAesKey(unlock.vuk, content.itemSalt)
  const iv = fromBase64(content.iv)
  const ciphertext = fromBase64(content.data)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return JSON.parse(new TextDecoder().decode(plaintext)) as PasswordContent
}
