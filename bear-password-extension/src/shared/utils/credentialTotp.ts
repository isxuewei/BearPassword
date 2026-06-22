import type { FillCredential } from '@/shared/types'
import { copyTextToClipboard, copyTextToClipboardSync } from '@/shared/utils/copyText'
import { sendMessage } from '@/shared/utils/messaging'
import { generateTotpSnapshot } from '@/shared/utils/totp'

export function getCredentialTotpCode(credential: Pick<FillCredential, 'authenticator'>): string | null {
  if (!credential.authenticator) return null
  return generateTotpSnapshot(credential.authenticator)?.code ?? null
}

export async function copyCredentialTotpCode(
  credential: Pick<FillCredential, 'authenticator'>,
  root: ParentNode = document
): Promise<string | null> {
  const code = getCredentialTotpCode(credential)
  if (!code) return null

  if (copyTextToClipboardSync(code, root)) return code

  try {
    await sendMessage<boolean>({ type: 'COPY_TEXT', payload: { text: code } })
    return code
  } catch {
    // ignore
  }

  const copied = await copyTextToClipboard(code, root)
  return copied ? code : null
}

export function copyCredentialTotpCodeSync(
  credential: Pick<FillCredential, 'authenticator'>,
  root: ParentNode = document
): string | null {
  const code = getCredentialTotpCode(credential)
  if (!code) return null
  return copyTextToClipboardSync(code, root) ? code : null
}
