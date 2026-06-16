/**
 * 数据库 content 读写
 */
import type { DatabaseContent, LoginExtraField } from '@/types'

export function createEmptyDatabaseContent(): DatabaseContent {
  return {
    title: '',
    dbType: '',
    host: '',
    port: '',
    databaseName: '',
    username: '',
    password: '',
    extraFields: []
  }
}

function normalizeExtraFields(raw: unknown): LoginExtraField[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const field = item as Record<string, unknown>
    return {
      label: String(field.label ?? ''),
      value: String(field.value ?? '')
    }
  })
}

function fieldValue(fields: LoginExtraField[], labels: string[]): string {
  const field = fields.find((item) => labels.includes(item.label.trim()))
  return field?.value.trim() ?? ''
}

function hasAnyFieldLabel(fields: LoginExtraField[], labels: string[]): boolean {
  return labels.some((label) => fields.some((field) => field.label.trim() === label))
}

/** 旧版以「自定义」保存的数据库条目：需同时包含主机、端口、库名，或标题为「数据库」 */
function isLegacyDatabaseCustomShape(raw: Record<string, unknown>, fields: LoginExtraField[]): boolean {
  if (String(raw.title ?? '').trim() === '数据库') return true
  return (
    hasAnyFieldLabel(fields, ['主机']) &&
    hasAnyFieldLabel(fields, ['端口']) &&
    hasAnyFieldLabel(fields, ['数据库名', '数据库'])
  )
}

function migrateFromCustomFields(raw: Record<string, unknown>): DatabaseContent | null {
  if (!Array.isArray(raw.fields)) return null
  const fields = normalizeExtraFields(raw.fields)
  if (!fields.length) return null
  if (!isLegacyDatabaseCustomShape(raw, fields)) return null

  return {
    title: String(raw.title ?? '数据库'),
    dbType: String(raw.dbType ?? fieldValue(fields, ['类型'])),
    host: fieldValue(fields, ['主机']),
    port: fieldValue(fields, ['端口']),
    databaseName: fieldValue(fields, ['数据库名', '数据库']),
    username: fieldValue(fields, ['用户名']),
    password: fieldValue(fields, ['密码']),
    extraFields: []
  }
}

export function normalizeDatabaseContent(raw: Record<string, unknown>): DatabaseContent {
  const migrated = migrateFromCustomFields(raw)
  if (migrated) return migrated

  return {
    title: String(raw.title ?? '数据库'),
    dbType: String(raw.dbType ?? ''),
    host: String(raw.host ?? ''),
    port: String(raw.port ?? ''),
    databaseName: String(raw.databaseName ?? ''),
    username: String(raw.username ?? ''),
    password: String(raw.password ?? ''),
    extraFields: normalizeExtraFields(raw.extraFields)
  }
}

export function serializeDatabaseContent(content: DatabaseContent): DatabaseContent {
  return {
    title: content.title.trim(),
    dbType: content.dbType.trim(),
    host: content.host.trim(),
    port: content.port.trim(),
    databaseName: content.databaseName.trim(),
    username: content.username.trim(),
    password: content.password,
    extraFields: content.extraFields.filter((field) => field.label.trim() || field.value.trim())
  }
}

export function getDatabaseTitle(content: Record<string, unknown>): string {
  const database = normalizeDatabaseContent(content)
  if (database.title.trim() && database.title !== '数据库') return database.title
  if (database.dbType.trim()) return database.dbType
  if (database.host.trim()) return database.host
  return '数据库'
}

export function isLegacyDatabaseCustomEntry(
  passwordType: string,
  content: Record<string, unknown>
): boolean {
  return passwordType === '自定义' && migrateFromCustomFields(content) !== null
}
