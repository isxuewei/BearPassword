import { getPasswordListRawApi } from '@/api/vaultRaw'
import {
  decryptContentObject,
  isEncryptedContent,
  type VaultUnlockContext
} from '@/utils/contentCrypto'

/** 尝试解密样本条目，验证主密码是否正确 */
export async function verifyVaultUnlockContext(unlock: VaultUnlockContext): Promise<boolean> {
  const data = await getPasswordListRawApi({ page: 1, pageSize: 200 })
  const encrypted = data.list.filter((entry) => isEncryptedContent(entry.content))
  if (!encrypted.length) return true

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
