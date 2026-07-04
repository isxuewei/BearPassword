import { useSecurityStore } from '@/stores/security'
import { deriveVaultUnlockKey } from '@/utils/vaultCrypto/vaultKeyDerivation'
import { loadPersistedSecurityKey } from '@/utils/securityKeyStorage'
import {
  reencryptAllPasswordContents,
  SecurityKeyReencryptError,
  type SecurityKeyReencryptProgressHandler
} from '@/utils/securityKeyReencrypt'
import { verifyVaultUnlockContext } from '@/utils/vaultUnlockVerify'
import { persistVaultPassword } from '@/utils/vaultPasswordStorage'

export { SecurityKeyReencryptError as MasterPasswordChangeError }

/** 修改主密码：校验旧密码后，用新 VUK 重新加密全部条目 */
export async function changeMasterPassword(
  oldPassword: string,
  newPassword: string,
  onProgress?: SecurityKeyReencryptProgressHandler
): Promise<number> {
  const securityStore = useSecurityStore()
  await securityStore.ensureVaultCryptoMeta()

  const accountKey = await loadPersistedSecurityKey()
  if (!accountKey?.trim()) {
    throw new SecurityKeyReencryptError('本机未找到账户密钥，请使用 Emergency Kit 恢复')
  }

  const vaultSalt = securityStore.vaultSalt
  if (!vaultSalt) {
    throw new SecurityKeyReencryptError('服务端缺少保险库加密配置')
  }

  const oldVuk = await deriveVaultUnlockKey(oldPassword, accountKey, vaultSalt)
  const oldUnlock = { vuk: oldVuk }
  const verified = await verifyVaultUnlockContext(oldUnlock)
  if (!verified) {
    throw new SecurityKeyReencryptError('当前主密码错误，无法解密已有条目')
  }

  const newVuk = await deriveVaultUnlockKey(newPassword, accountKey, vaultSalt)
  const newUnlock = { vuk: newVuk }

  securityStore.beginMigration('正在准备重新加密…')
  try {
    const count = await reencryptAllPasswordContents(oldUnlock, newUnlock, onProgress)
    securityStore.applyVaultUnlock(newVuk)
    await persistVaultPassword(newPassword)
    return count
  } finally {
    securityStore.endMigration()
  }
}
