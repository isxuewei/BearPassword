/**
 * 认证相关类型定义
 */

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应数据 */
export interface LoginResult {
  token: string
  username: string
  avatar?: string
  /** 注册时 Emergency Kit 是否已成功发送至邮箱 */
  emergencyKitEmailSent?: boolean
}

/** MFA 登录挑战（SRP 成功后） */
export interface MfaLoginChallenge {
  mfaRequired: true
  mfaToken: string
  mfaMethods: string[]
  serverProof: string
}

export type LoginFlowResult = LoginResult | MfaLoginChallenge

export function isMfaLoginChallenge(result: LoginFlowResult): result is MfaLoginChallenge {
  return 'mfaRequired' in result && result.mfaRequired === true
}

/** 当前登录用户信息 */
export interface UserInfo {
  username: string
  avatar?: string
  token: string
}

/** 服务端返回的用户详情 */
export interface UserProfile {
  userId: number
  username: string
  avatar?: string
  vaultSalt?: string | null
  secretKeyFingerprint?: string | null
}

/** 保险库加密元数据 */
export interface VaultCryptoMeta {
  vaultSalt: string | null
  secretKeyFingerprint: string | null
}

/** 保险库加密注册参数 */
export interface VaultCryptoSetup {
  vaultSalt: string
  secretKeyFingerprint: string
}

/** SRP 凭证（hex） */
export interface SrpCredentialsSetup {
  salt: string
  verifier: string
}

/** 修改登录密码参数 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/** 修改用户名参数 */
export interface UpdateUsernameParams {
  username: string
}

/** 用户名可用性校验结果 */
export interface UsernameCheckResult {
  available: boolean
}

/** 头像上传响应 */
export interface AvatarUploadResult {
  avatar: string
}

/** 发送注册验证码参数 */
export interface SendRegisterCodeParams {
  email: string
}

/** 注册参数 */
export interface RegisterParams {
  email: string
  code: string
  username: string
  srp: SrpCredentialsSetup
  vaultCrypto: VaultCryptoSetup
  emergencyKitContent: string
}
