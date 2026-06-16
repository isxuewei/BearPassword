import {
  createVerifierAndSalt,
  SRPClientSession,
  SRPParameters,
  SRPRoutines,
  type IVerifierAndSalt
} from 'tssrp6a'

/** RFC 5054 2048-bit + SHA-512，与服务端 Nimbus SRP6a 一致 */
export const srpRoutines = new SRPRoutines(
  new SRPParameters(SRPParameters.PrimeGroup[2048], SRPParameters.H.SHA512)
)

export interface SrpCredentials {
  salt: string
  verifier: string
}

export interface SrpLoginInitResult {
  sessionId?: string
  identity?: string
  salt?: string
  serverPublicEphemeral?: string
}

export interface SrpLoginVerifyPayload {
  sessionId: string
  clientPublicEphemeral: string
  clientProof: string
}

export interface SrpLoginVerifyResult {
  serverProof: string
  token?: string
  username?: string
  nickname?: string
  avatar?: string
  passwordChangeToken?: string
}

function toHex(value: bigint): string {
  return value.toString(16)
}

function fromHex(value: string): bigint {
  const normalized = value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value
  return BigInt(`0x${normalized}`)
}

/** 注册 / 改密 / 存量升级：本地计算 SRP 凭证，密码不出设备 */
export async function createSrpCredentials(identity: string, password: string): Promise<SrpCredentials> {
  const { s, v } = await createVerifierAndSalt(srpRoutines, identity, password)
  return {
    salt: toHex(s),
    verifier: toHex(v)
  }
}

/** 完整 SRP 客户端证明 */
export async function performSrpClientSteps(
  identity: string,
  password: string,
  init: Required<Pick<SrpLoginInitResult, 'salt' | 'serverPublicEphemeral'>>
): Promise<{
  clientPublicEphemeral: string
  clientProof: string
  confirmServerProof: (serverProof: string) => Promise<void>
}> {
  const client = new SRPClientSession(srpRoutines)
  const step1 = await client.step1(identity, password)
  const step2 = await step1.step2(fromHex(init.salt), fromHex(init.serverPublicEphemeral))

  return {
    clientPublicEphemeral: toHex(step2.A),
    clientProof: toHex(step2.M1),
    confirmServerProof: async (serverProof: string) => {
      await step2.step3(fromHex(serverProof))
    }
  }
}

export type { IVerifierAndSalt }
