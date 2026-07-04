import { concatBytes, fromBase64, toBase64 } from '@/utils/vaultCrypto/encoding'

const DB_NAME = 'bearpassword_web'
const DB_VERSION = 1
const META_STORE = 'meta'
const SECRETS_STORE = 'secrets'

const DEVICE_KEY_FIELD = 'deviceKey'
const SECURITY_KEY_FIELD = 'securityKey'
const VAULT_PASSWORD_FIELD = 'vaultPassword'

const WRAP_INFO = new TextEncoder().encode('bearpassword-web-wrap-v1')

interface EncryptedBlob {
  iv: string
  ciphertext: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 打开失败'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE)
      }
      if (!db.objectStoreNames.contains(SECRETS_STORE)) {
        db.createObjectStore(SECRETS_STORE)
      }
    }
  })
}

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const request = tx.objectStore(storeName).get(key)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 读取失败'))
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null)
    tx.oncomplete = () => db.close()
  })
}

async function idbSet(storeName: string, key: string, value: unknown): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(value, key)
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 写入失败'))
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
  })
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).delete(key)
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 删除失败'))
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
  })
}

async function idbClearStore(storeName: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).clear()
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB 清空失败'))
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
  })
}

async function deriveWrapKey(deviceKey: Uint8Array): Promise<CryptoKey> {
  const keyBytes = new Uint8Array(deviceKey)
  const baseKey = await crypto.subtle.importKey('raw', keyBytes, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: WRAP_INFO },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function getOrCreateDeviceKey(): Promise<Uint8Array> {
  const stored = await idbGet<string>(META_STORE, DEVICE_KEY_FIELD)
  if (stored) {
    return fromBase64(stored)
  }
  const deviceKey = crypto.getRandomValues(new Uint8Array(32))
  await idbSet(META_STORE, DEVICE_KEY_FIELD, toBase64(deviceKey))
  return deviceKey
}

async function encryptSecret(plaintext: string): Promise<EncryptedBlob> {
  const deviceKey = await getOrCreateDeviceKey()
  const wrapKey = await deriveWrapKey(deviceKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    wrapKey,
    encoded
  )
  return {
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext))
  }
}

async function decryptSecret(blob: EncryptedBlob): Promise<string> {
  const deviceKey = await getOrCreateDeviceKey()
  const wrapKey = await deriveWrapKey(deviceKey)
  const iv = fromBase64(blob.iv)
  const ciphertext = fromBase64(blob.ciphertext)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    wrapKey,
    new Uint8Array(ciphertext)
  )
  return new TextDecoder().decode(decrypted)
}

export async function isWebSecureStorageAvailable(): Promise<boolean> {
  try {
    return typeof indexedDB !== 'undefined' && !!crypto.subtle
  } catch {
    return false
  }
}

export async function loadWebSecurityKey(): Promise<string | null> {
  const blob = await idbGet<EncryptedBlob>(SECRETS_STORE, SECURITY_KEY_FIELD)
  if (!blob) return null
  try {
    const value = await decryptSecret(blob)
    return value.trim() || null
  } catch {
    return null
  }
}

export async function persistWebSecurityKey(key: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = key.trim()
  if (!normalized) {
    return { ok: false, error: '安全密钥不能为空' }
  }
  try {
    const blob = await encryptSecret(normalized)
    await idbSet(SECRETS_STORE, SECURITY_KEY_FIELD, blob)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '安全密钥保存失败' }
  }
}

export async function clearWebSecurityKey(): Promise<void> {
  await idbDelete(SECRETS_STORE, SECURITY_KEY_FIELD)
}

export async function loadWebVaultPassword(): Promise<string | null> {
  const blob = await idbGet<EncryptedBlob>(SECRETS_STORE, VAULT_PASSWORD_FIELD)
  if (!blob) return null
  try {
    return await decryptSecret(blob)
  } catch {
    return null
  }
}

export async function persistWebVaultPassword(
  password: string
): Promise<{ ok: boolean; error?: string }> {
  if (!password) {
    return { ok: false, error: '密码不能为空' }
  }
  try {
    const blob = await encryptSecret(password)
    await idbSet(SECRETS_STORE, VAULT_PASSWORD_FIELD, blob)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : '密码保存失败' }
  }
}

export async function clearWebVaultPassword(): Promise<void> {
  await idbDelete(SECRETS_STORE, VAULT_PASSWORD_FIELD)
}

/** 完全退出：清除本机所有 Web 端密钥与密码 */
export async function clearAllWebSecrets(): Promise<void> {
  await idbClearStore(SECRETS_STORE)
  await idbClearStore(META_STORE)
}

/** 检测 wrapKey 是否可用（设备密钥是否存在） */
export async function hasWebDeviceKey(): Promise<boolean> {
  const stored = await idbGet<string>(META_STORE, DEVICE_KEY_FIELD)
  return !!stored
}

export function fingerprintDeviceKey(bytes: Uint8Array): string {
  return toBase64(bytes.slice(0, 8))
}

export { concatBytes }
