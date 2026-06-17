/** API 通用类型 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 认证 */
export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  username: string
  avatar?: string
}

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

export interface UserProfile {
  userId: number
  username: string
  avatar?: string
  vaultSalt?: string | null
  secretKeyFingerprint?: string | null
}

/** 密码库 */
export type PasswordType =
  | '登录信息'
  | '服务器'
  | '银行卡'
  | '身份信息'
  | '安全备注'
  | '数据库'
  | '自定义'

export interface LoginExtraField {
  label: string
  value: string
}

export interface LoginContent {
  title: string
  username: string
  password: string
  websites: string[]
  host: string
  extraFields: LoginExtraField[]
}

export type PasswordContent =
  | LoginContent
  | Record<string, unknown>

export interface PasswordEntry {
  id: number
  passwordType: PasswordType
  content: PasswordContent
  createTime?: string
  updateTime?: string
  favorite?: boolean
  passwordLabels?: string[]
  passwordTitle?: string
  websites?: string[]
  remark?: string
}

export interface PasswordEntryParams {
  passwordType: PasswordType
  passwordLabels: string[]
  passwordTitle?: string
  content: PasswordContent
  websites?: string[]
  remark?: string
}

export interface PasswordQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  passwordType?: PasswordType | ''
}

/** 自动填充用精简条目 */
export interface FillCredential {
  id: number
  title: string
  username: string
  password: string
  websites: string[]
  favorite?: boolean
}

/** 桌面端连接状态（扩展通过本地桥接 127.0.0.1:6892 获取） */
export interface DesktopConnectionState {
  ready: boolean
  loggedIn: boolean
  unlocked: boolean
  locked: boolean
  username: string | null
  themePreference: string | null
  localePreference: string | null
}

/** @deprecated 扩展不再独立登录，保留类型别名便于迁移 */
export type ExtensionSession = DesktopConnectionState

/** 消息协议 */
export type MessageType =
  | 'GET_DESKTOP_STATE'
  | 'REFRESH_DESKTOP_STATE'
  | 'GET_MATCHING_CREDENTIALS'
  | 'GET_ALL_LOGIN_CREDENTIALS'
  | 'AUTOFILL'
  | 'SAVE_CREDENTIAL'
  | 'CREATE_CREDENTIAL'
  | 'UPDATE_CREDENTIAL'
  | 'TOGGLE_FAVORITE'
  | 'DELETE_CREDENTIAL'
  | 'UPDATE_BADGE'
  | 'GENERATE_PASSWORD'
  | 'WAKE_DESKTOP'

export interface ExtensionMessage<T = unknown> {
  type: MessageType
  payload?: T
}

export interface AutofillPayload {
  tabId?: number
  credentialId: number
}

export interface SaveCredentialPayload {
  title: string
  username: string
  password: string
  website: string
}

export interface UpsertCredentialPayload {
  title: string
  username: string
  password: string
  websites: string[]
}

export interface UpdateCredentialPayload extends UpsertCredentialPayload {
  credentialId: number
}

/** host：按主机名/IP + 端口匹配；path：按完整路径匹配 */
export type WebsiteMatchMode = 'host' | 'path'

export interface MatchingCredentialsPayload {
  url: string
  matchBy?: WebsiteMatchMode
  /** 为 true 时跳过缓存，重新请求接口 */
  force?: boolean
}

export interface MatchingCredentialsResult {
  credentials: FillCredential[]
  needsSecurityKey: boolean
  /** 桌面端是否已连接且保险库已解锁 */
  desktopUnlocked: boolean
  /** 桌面端桥接是否可用（用于 content 同步主题/语言） */
  desktopReady?: boolean
  themePreference?: string | null
  localePreference?: string | null
}
