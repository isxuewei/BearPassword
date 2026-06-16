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

/** 扩展会话状态 */
export interface ExtensionSession {
  token: string
  username: string
  avatar?: string
  serverOrigin: string
  securityKey: string | null
  vukBase64: string | null
}

export interface SecurityKeyApplyResult {
  session: ExtensionSession
  usableCount: number
  encryptedTotal: number
}

/** 消息协议 */
export type MessageType =
  | 'GET_SESSION'
  | 'SET_SESSION'
  | 'SET_SECURITY_KEY'
  | 'CLEAR_SECURITY_KEY'
  | 'LOGOUT'
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
}
