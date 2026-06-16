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
  nickname: string
  avatar?: string
}

/** 当前登录用户信息 */
export interface UserInfo {
  username: string
  nickname: string
  avatar?: string
  token: string
}

/** 服务端返回的用户详情 */
export interface UserProfile {
  userId: number
  username: string
  nickname: string
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

/** 修改登录密码参数 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/** 修改用户名参数 */
export interface UpdateUsernameParams {
  username: string
}

/** 修改昵称参数 */
export interface UpdateNicknameParams {
  nickname: string
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
  password: string
  vaultCrypto: VaultCryptoSetup
}

/** 更换密钥验证码校验参数 */
export interface VerifySecurityKeyChangeCodeParams {
  code: string
}

/** 更换密钥验证码发送结果 */
export interface SecurityKeyChangeCodeResult {
  maskedEmail: string
}
