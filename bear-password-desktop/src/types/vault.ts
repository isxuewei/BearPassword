/**
 * 密码库类型定义
 */

/** 密码类型 */
export type PasswordType =
  | '登录信息'
  | '服务器'
  | '银行卡'
  | '身份信息'
  | '安全备注'
  | '数据库'
  | '自定义'

/** 登录信息自定义字段 */
export interface LoginExtraField {
  label: string
  value: string
}

/** 登录信息内容 */
export interface LoginContent {
  title: string
  username: string
  password: string
  websites: string[]
  host: string
  extraFields: LoginExtraField[]
}

/** 银行卡内容 */
export interface BankCardContent {
  title: string
  bankName: string
  cardHolder: string
  cardNumber: string
  expiry: string
  cvv: string
  extraFields: LoginExtraField[]
}

/** 身份信息内容 */
export interface IdentityContent {
  title: string
  name: string
  idNumber: string
  birthDate: string
  lunarBirthday: string
  phone: string
  address: string
  extraFields: LoginExtraField[]
}

/** 数据库内容 */
export interface DatabaseContent {
  title: string
  dbType: string
  host: string
  port: string
  databaseName: string
  username: string
  password: string
  extraFields: LoginExtraField[]
}

/** 自定义字段 */
export interface CustomField {
  label: string
  value: string
}

/** 自定义内容 */
export interface CustomContent {
  title: string
  fields: CustomField[]
}

/** 安全备注内容 */
export interface SecureNoteContent {
  title: string
  body: string
  extraFields: LoginExtraField[]
}

/** 密码内容（按类型扩展） */
export type PasswordContent =
  | LoginContent
  | BankCardContent
  | IdentityContent
  | CustomContent
  | DatabaseContent
  | SecureNoteContent
  | Record<string, unknown>

/** 密码条目（服务端仅返回 passwordType + content，衍生字段由客户端解析） */
export interface PasswordEntry {
  id: number
  passwordType: PasswordType
  content: PasswordContent
  createTime?: string
  updateTime?: string
  favorite?: boolean
  favoriteTime?: string
  recentVisitTime?: string
  /** 客户端从 content 解析 */
  passwordLabels?: string[]
  passwordTitle?: string
  websites?: string[]
  remark?: string
}

/** 创建 / 更新表单参数（提交前合并进 content） */
export interface PasswordEntryParams {
  passwordType: PasswordType
  passwordLabels: string[]
  passwordTitle?: string
  content: PasswordContent
  websites?: string[]
  remark?: string
}

/** 列表查询参数 */
export interface PasswordQueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  passwordType?: PasswordType | ''
}

/** 收藏 / 最近访问关联元数据（不含 content） */
export interface PasswordRelationMetaItem {
  passwordId: number
  time?: string
}

/** 新增密码 — 类型选择项 */
export interface PasswordPickerItem {
  label: string
  value: PasswordType
  keywords: string[]
  color: string
  featured?: boolean
}

/** 密码导入入口（类型选择器） */
export interface PasswordImportPickerItem {
  keywords: string[]
  color: string
}

export const PASSWORD_IMPORT_PICKER_ITEM: PasswordImportPickerItem = {
  keywords: ['导入', 'import', 'chrome', 'firefox', 'edge', 'safari', '浏览器', 'csv', '密码'],
  color: '#e76f51'
}

/** 类型选择器选项 */
export const PASSWORD_PICKER_ITEMS: PasswordPickerItem[] = [
  {
    label: '登录信息',
    value: '登录信息',
    keywords: ['登录', '账号', '网站', 'login'],
    color: '#2ec4b6',
    featured: true
  },
  {
    label: '安全备注',
    value: '安全备注',
    keywords: ['备注', '笔记', 'note', '安全'],
    color: '#f4a261',
    featured: true
  },
  {
    label: '银行卡',
    value: '银行卡',
    keywords: ['银行卡', '信用卡', '卡号', 'card'],
    color: '#4ea8de',
    featured: true
  },
  {
    label: '身份标识',
    value: '身份信息',
    keywords: ['身份', '证件', '身份证', 'identity'],
    color: '#06d6a0',
    featured: true
  },
  {
    label: '服务器',
    value: '服务器',
    keywords: ['服务器', 'server', 'ssh', '主机', 'vps', 'linux'],
    color: '#1b998b',
    featured: true
  },
  {
    label: '数据库',
    value: '数据库',
    keywords: ['数据库', 'database', 'mysql', 'postgres', 'redis', 'sql'],
    color: '#5e60ce',
    featured: true
  },
  {
    label: '自定义',
    value: '自定义',
    keywords: ['自定义', 'custom', '其他'],
    color: '#9b5de5',
    featured: false
  }
]

/** 列表筛选用（后端类型） */
export const PASSWORD_TYPE_OPTIONS: { label: string; value: PasswordType }[] = [
  { label: '登录信息', value: '登录信息' },
  { label: '服务器', value: '服务器' },
  { label: '安全备注', value: '安全备注' },
  { label: '银行卡', value: '银行卡' },
  { label: '身份标识', value: '身份信息' },
  { label: '数据库', value: '数据库' },
  { label: '自定义', value: '自定义' }
]
