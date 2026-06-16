import type { LoginResult } from '@/shared/types'
import { http } from '@/shared/utils/request'

export function verifyTotpLoginApi(origin: string, mfaToken: string, code: string): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/mfa/totp/verify', { mfaToken, code }, { origin })
}
