import {
  createVerifierAndSalt,
  SRPClientSession,
  SRPParameters,
  SRPRoutines
} from 'tssrp6a'

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

export async function createSrpCredentials(identity: string, password: string): Promise<SrpCredentials> {
  const { s, v } = await createVerifierAndSalt(srpRoutines, identity, password)
  return {
    salt: toHex(s),
    verifier: toHex(v)
  }
}

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
