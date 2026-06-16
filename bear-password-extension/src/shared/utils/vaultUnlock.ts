import type { ExtensionSession } from '@/shared/types'
import { unlockFromBase64, type VaultUnlockContext } from '@/shared/utils/contentCrypto'

export function getVaultUnlockFromSession(session: ExtensionSession): VaultUnlockContext | null {
  if (!session.vukBase64) return null
  return unlockFromBase64(session.vukBase64)
}
