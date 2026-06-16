import { useSecurityStore } from '@/stores/security'
import { isValidSecurityKeyLength, SECURITY_KEY_LENGTH } from '@/utils/contentCrypto'
import {
  reencryptAllPasswordContents,
  SecurityKeyReencryptError,
  type SecurityKeyReencryptProgressHandler
} from '@/utils/securityKeyReencrypt'
import { computeSecretKeyFingerprint, deriveVaultUnlockKey } from '@/utils/vaultCrypto/vaultKeyDerivation'
import { verifyVaultUnlockContext } from '@/utils/vaultUnlockVerify'
import { persistVaultPassword } from '@/utils/vaultPasswordStorage'

export class LocalVaultSetupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LocalVaultSetupError'
  }
}

/** 新设备 / 本机首次：验证并保存主密码与账户密钥，解锁保险库 */
export async function completeLocalVaultSetup(
  masterPassword: string,
  accountSecretKey: string,
  onProgress?: SecurityKeyReencryptProgressHandler
): Promise<number> {
  const securityStore = useSecurityStore()
  await securityStore.ensureVaultCryptoMeta()

  const mp = masterPassword.trim()
  const key = accountSecretKey.trim()

  if (!mp) {
    throw new LocalVaultSetupError('请输入主密码')
  }
  if (!isValidSecurityKeyLength(key)) {
    throw new LocalVaultSetupError(`账户密钥必须为 ${SECURITY_KEY_LENGTH} 位字符`)
  }

  if (securityStore.secretKeyFingerprint) {
    const fingerprint = await computeSecretKeyFingerprint(key)
    if (fingerprint !== securityStore.secretKeyFingerprint) {
      throw new LocalVaultSetupError('账户密钥与服务端指纹不一致，请从 Emergency Kit 恢复正确密钥')
    }
  }

  const vaultSalt = securityStore.vaultSalt
  if (!vaultSalt) {
    throw new LocalVaultSetupError('服务端缺少保险库加密配置')
  }

  const vuk = await deriveVaultUnlockKey(mp, key, vaultSalt)
  const unlock = { vuk }
  const verified = await verifyVaultUnlockContext(unlock)
  if (!verified) {
    throw new LocalVaultSetupError('主密码或账户密钥错误，无法解密保险库')
  }

  securityStore.beginMigration('正在配置本机保险库…')
  try {
    const count = await reencryptAllPasswordContents(null, unlock, onProgress)
    await securityStore.setSecurityKey(key)
    securityStore.applyVaultUnlock(vuk)
    const persisted = await persistVaultPassword(mp)
    if (!persisted.ok) {
      console.warn('[vault-setup] master password persist failed:', persisted.error)
    }
    return count
  } catch (err) {
    if (err instanceof SecurityKeyReencryptError) {
      throw new LocalVaultSetupError(err.message)
    }
    throw err
  } finally {
    securityStore.endMigration()
  }
}
