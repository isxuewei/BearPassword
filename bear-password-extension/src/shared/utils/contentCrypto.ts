/**
 * 密码条目 content 客户端加解密（v2：VUK + 每条目 itemSalt）
 */
import type { PasswordContent } from '@/shared/types'

export const ENCRYPTED_CONTENT_MARKER = '__encrypted__'

const CRYPTO_VERSION_V2 = 2
const MASTER_PASSWORD_PEPPER = new TextEncoder().encode('bear-password-master-password-v2')
const MASTER_PASSWORD_ITERATIONS = 600_000
const VUK_HKDF_INFO = new TextEncoder().encode('bear-password-vuk-v2')
const ITEM_KEY_HKDF_INFO = new TextEncoder().encode('bear-password-item-v2')

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

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const merged = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    merged.set(part, offset)
    offset += part.length
  }
  return merged
}

export function isEncryptedContent(content: unknown): content is EncryptedContentEnvelope {
  if (!content || typeof content !== 'object') return false
  const record = content as Record<string, unknown>
  return (
    record[ENCRYPTED_CONTENT_MARKER] === true &&
    typeof record.iv === 'string' &&
    typeof record.data === 'string'
  )
}

export { toBase64, fromBase64 }

async function deriveMasterPasswordKey(masterPassword: string): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: MASTER_PASSWORD_PEPPER,
      iterations: MASTER_PASSWORD_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )
  return new Uint8Array(bits)
}

export async function deriveVaultUnlockKey(
  masterPassword: string,
  accountSecretKey: string,
  vaultSaltBase64: string
): Promise<Uint8Array> {
  const mpKey = await deriveMasterPasswordKey(masterPassword)
  const secretKeyBytes = new TextEncoder().encode(accountSecretKey.trim())
  const vaultSalt = fromBase64(vaultSaltBase64)
  const ikm = concatBytes(mpKey, secretKeyBytes)
  const baseKey = await crypto.subtle.importKey('raw', ikm as unknown as BufferSource, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: vaultSalt as unknown as BufferSource,
      info: VUK_HKDF_INFO
    },
    baseKey,
    256
  )
  return new Uint8Array(bits)
}

async function deriveItemAesKey(vuk: Uint8Array, itemSaltBase64: string): Promise<CryptoKey> {
  const itemSalt = fromBase64(itemSaltBase64)
  const baseKey = await crypto.subtle.importKey('raw', vuk as unknown as BufferSource, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: itemSalt as unknown as BufferSource,
      info: ITEM_KEY_HKDF_INFO
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
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
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext
  )
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
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  )
  return JSON.parse(new TextDecoder().decode(plaintext)) as PasswordContent
}

export function unlockFromBase64(vukBase64: string): VaultUnlockContext {
  return { vuk: fromBase64(vukBase64) }
}
