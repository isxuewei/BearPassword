import {
  ACCOUNT_SECRET_KEY_LENGTH,
  ITEM_KEY_HKDF_INFO,
  MASTER_PASSWORD_ITERATIONS,
  MASTER_PASSWORD_PEPPER,
  VUK_HKDF_INFO
} from '@/utils/vaultCrypto/constants'
import { concatBytes, fromBase64, toBase64 } from '@/utils/vaultCrypto/encoding'

export function generateAccountSecretKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(96))
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_')
}

export function isValidAccountSecretKeyLength(key: string): boolean {
  return key.trim().length === ACCOUNT_SECRET_KEY_LENGTH
}

export function generateVaultSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(32)))
}

export async function computeSecretKeyFingerprint(accountSecretKey: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(accountSecretKey.trim())
  )
  return toBase64(new Uint8Array(digest))
}

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

/** 主密码 + 账户密钥 + vault_salt → 32 字节 VUK */
export async function deriveVaultUnlockKey(
  masterPassword: string,
  accountSecretKey: string,
  vaultSaltBase64: string
): Promise<Uint8Array> {
  const mpKey = await deriveMasterPasswordKey(masterPassword)
  const secretKeyBytes = new TextEncoder().encode(accountSecretKey.trim())
  const vaultSalt = fromBase64(vaultSaltBase64)
  const ikm = concatBytes(mpKey, secretKeyBytes)

  const baseKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: vaultSalt,
      info: VUK_HKDF_INFO
    },
    baseKey,
    256
  )
  return new Uint8Array(bits)
}

export async function deriveItemAesKey(vuk: Uint8Array, itemSaltBase64: string): Promise<CryptoKey> {
  const itemSalt = fromBase64(itemSaltBase64)
  const baseKey = await crypto.subtle.importKey('raw', vuk, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: itemSalt,
      info: ITEM_KEY_HKDF_INFO
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}
