import { request } from '@/utils/request'
import type { ChangePasswordParams, LoginParams, LoginResult, RegisterParams } from '@/types'
import { isMfaLoginChallenge, type LoginFlowResult } from '@/types/auth'
import {
  createSrpCredentials,
  performSrpClientSteps,
  type SrpLoginInitResult,
  type SrpLoginVerifyResult
} from '@/utils/srp/srpClient'
import { verifyTotpLoginApi } from '@/api/mfa'

async function srpLoginInitApi(username: string): Promise<SrpLoginInitResult> {
  return request.post<SrpLoginInitResult>('/auth/login/init', { username })
}

async function srpLoginVerifyApi(payload: {
  sessionId: string
  clientPublicEphemeral: string
  clientProof: string
}): Promise<SrpLoginVerifyResult> {
  return request.post<SrpLoginVerifyResult>('/auth/login/verify', payload)
}

/** SRP 登录：密码不出设备；若启用 MFA 则返回挑战 */
export async function loginApi(params: LoginParams): Promise<LoginFlowResult> {
  const init = await srpLoginInitApi(params.username)

  if (!init.sessionId || !init.identity || !init.salt || !init.serverPublicEphemeral) {
    throw new Error('SRP 初始化失败')
  }

  const proof = await performSrpClientSteps(init.identity, params.password, {
    salt: init.salt,
    serverPublicEphemeral: init.serverPublicEphemeral
  })

  const verified = await srpLoginVerifyApi({
    sessionId: init.sessionId,
    clientPublicEphemeral: proof.clientPublicEphemeral,
    clientProof: proof.clientProof
  })

  await proof.confirmServerProof(verified.serverProof)

  if (verified.mfaRequired && verified.mfaToken) {
    return {
      mfaRequired: true,
      mfaToken: verified.mfaToken,
      mfaMethods: verified.mfaMethods ?? [],
      serverProof: verified.serverProof
    }
  }

  if (!verified.token || !verified.username) {
    throw new Error('登录失败')
  }

  return {
    token: verified.token,
    username: verified.username,
    nickname: verified.nickname ?? verified.username,
    avatar: verified.avatar
  }
}

export async function completeTotpLoginApi(mfaToken: string, code: string): Promise<LoginResult> {
  return verifyTotpLoginApi(mfaToken, code)
}

export { isMfaLoginChallenge }

/** 注册：仅上传 SRP 凭证，不上传明文密码 */
export async function registerApi(params: RegisterParams): Promise<LoginResult> {
  return request.post<LoginResult>('/auth/register', params)
}

async function srpPasswordInitApi(): Promise<SrpLoginInitResult> {
  return request.post<SrpLoginInitResult>('/auth/password/srp/init')
}

async function srpPasswordVerifyApi(payload: {
  sessionId: string
  clientPublicEphemeral: string
  clientProof: string
}): Promise<SrpLoginVerifyResult> {
  return request.post<SrpLoginVerifyResult>('/auth/password/srp/verify', payload)
}

/** 修改登录密码：SRP 验证旧密码 + 上传新凭证 */
export async function changePasswordApi(params: ChangePasswordParams): Promise<void> {
  const init = await srpPasswordInitApi()
  if (!init.sessionId || !init.identity || !init.salt || !init.serverPublicEphemeral) {
    throw new Error('SRP 初始化失败')
  }

  const proof = await performSrpClientSteps(init.identity, params.oldPassword, {
    salt: init.salt,
    serverPublicEphemeral: init.serverPublicEphemeral
  })

  const verified = await srpPasswordVerifyApi({
    sessionId: init.sessionId,
    clientPublicEphemeral: proof.clientPublicEphemeral,
    clientProof: proof.clientProof
  })

  await proof.confirmServerProof(verified.serverProof)

  if (!verified.passwordChangeToken) {
    throw new Error('当前密码验证失败')
  }

  const newSrp = await createSrpCredentials(init.identity, params.newPassword)

  return request.put<void>('/auth/password', {
    passwordChangeToken: verified.passwordChangeToken,
    srp: newSrp
  })
}

export { createSrpCredentials }
