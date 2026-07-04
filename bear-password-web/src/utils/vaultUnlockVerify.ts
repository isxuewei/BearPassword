import { fetchAllPasswordEntriesRaw } from '@/api/vaultRaw'
import {
  decryptContentObject,
  isEncryptedContent,
  type VaultUnlockContext
} from '@/utils/contentCrypto'
import { loadPersistedVaultPassword } from '@/utils/vaultPasswordStorage'

function passwordsMatch(input: string, expected: string): boolean {
  const a = input.trim()
  const b = expected.trim()
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

/** 尝试解密样本条目，验证主密码是否正确 */
export async function verifyVaultUnlockContext(
  unlock: VaultUnlockContext,
  options?: { masterPassword?: string; allowWithoutEncryptedSamples?: boolean }
): Promise<boolean> {
  const all = await fetchAllPasswordEntriesRaw()
  const encrypted = all.filter((entry) => isEncryptedContent(entry.content))
  if (encrypted.length) {
    const samples = encrypted.slice(0, 5)
    for (const entry of samples) {
      try {
        await decryptContentObject(entry.content, unlock)
      } catch {
        return false
      }
    }
    return true
  }

  if (options?.allowWithoutEncryptedSamples) {
    return true
  }

  const masterPassword = options?.masterPassword?.trim()
  if (!masterPassword) return false

  const persisted = await loadPersistedVaultPassword()
  if (!persisted) return false

  return passwordsMatch(masterPassword, persisted)
}
