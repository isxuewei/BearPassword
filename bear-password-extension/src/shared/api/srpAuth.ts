import type { LoginParams, LoginResult } from '@/shared/types'
import { http } from '@/shared/utils/request'
import {
  createSrpCredentials,
  performSrpClientSteps,
  type SrpLoginInitResult,
  type SrpLoginVerifyResult
} from '@/shared/utils/srpClient'

async function srpLoginInitApi(origin: string, username: string): Promise<SrpLoginInitResult> {
  return http.post<SrpLoginInitResult>('/auth/login/init', { username }, { origin })
}

async function srpLoginVerifyApi(
  origin: string,
  payload: { sessionId: string; clientPublicEphemeral: string; clientProof: string }
): Promise<SrpLoginVerifyResult> {
  return http.post<SrpLoginVerifyResult>('/auth/login/verify', payload, { origin })
}

export async function loginApi(origin: string, params: LoginParams): Promise<LoginResult> {
  const init = await srpLoginInitApi(origin, params.username)

  if (!init.sessionId || !init.identity || !init.salt || !init.serverPublicEphemeral) {
    throw new Error('SRP 初始化失败')
  }

  const proof = await performSrpClientSteps(init.identity, params.password, {
    salt: init.salt,
    serverPublicEphemeral: init.serverPublicEphemeral
  })

  const verified = await srpLoginVerifyApi(origin, {
    sessionId: init.sessionId,
    clientPublicEphemeral: proof.clientPublicEphemeral,
    clientProof: proof.clientProof
  })

  await proof.confirmServerProof(verified.serverProof)

  if (!verified.token || !verified.username) {
    throw new Error('登录失败')
  }

  return {
    token: verified.token,
    username: verified.username,
    avatar: verified.avatar
  }
}

export { createSrpCredentials }
