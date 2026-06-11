import type { PasswordContent } from '@/shared/types'

export const ENCRYPTED_CONTENT_MARKER = '__encrypted__'
const CRYPTO_VERSION = 1
const PBKDF2_ITERATIONS = 120_000
const PBKDF2_SALT = new TextEncoder().encode('bear-password-content-v1')

export interface EncryptedContentEnvelope {
  [ENCRYPTED_CONTENT_MARKER]: true
  v: number
  iv: string
  data: string
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

async function deriveAesKey(passphrase: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: PBKDF2_SALT,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/** 生成随机安全密钥（Base64，约 43 字符） */
export function generateSecurityKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
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

export async function encryptContentObject(
  content: PasswordContent,
  passphrase: string
): Promise<EncryptedContentEnvelope> {
  const key = await deriveAesKey(passphrase)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(content))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    plaintext
  )

  return {
    [ENCRYPTED_CONTENT_MARKER]: true,
    v: CRYPTO_VERSION,
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext))
  }
}

export async function decryptContentObject(
  content: PasswordContent,
  passphrase: string
): Promise<PasswordContent> {
  if (!isEncryptedContent(content)) {
    return content
  }

  const key = await deriveAesKey(passphrase)
  const iv = fromBase64(content.iv)
  const ciphertext = fromBase64(content.data)
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  )
  return JSON.parse(new TextDecoder().decode(plaintext)) as PasswordContent
}
