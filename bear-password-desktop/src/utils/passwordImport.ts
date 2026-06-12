import type { PasswordEntryParams } from '@/types'
import { normalizeWebsiteHref } from '@/utils/loginContent'

export type BrowserImportFormat = 'chrome' | 'firefox' | 'safari' | 'edge' | 'generic'

export interface ParsedImportCredential {
  title: string
  url: string
  username: string
  password: string
  note: string
}

export interface PasswordImportParseResult {
  format: BrowserImportFormat
  rows: ParsedImportCredential[]
  skipped: number
}

const FORMAT_LABEL_KEYS: Record<BrowserImportFormat, string> = {
  chrome: 'entry.import.format.chrome',
  edge: 'entry.import.format.edge',
  firefox: 'entry.import.format.firefox',
  safari: 'entry.import.format.safari',
  generic: 'entry.import.format.generic'
}

export function getImportFormatLabelKey(format: BrowserImportFormat): string {
  return FORMAT_LABEL_KEYS[format]
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^"|"$/g, '').toLowerCase().replace(/\s+/g, '')
}

function parseCsvRows(text: string): string[][] {
  const normalized = text.replace(/^\uFEFF/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i]
    const next = normalized[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cell += ch
      }
      continue
    }

    if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell)
      if (row.some((item) => item.trim())) rows.push(row)
      row = []
      cell = ''
      if (ch === '\r') i++
    } else if (ch !== '\r') {
      cell += ch
    }
  }

  if (cell.length || row.length) {
    row.push(cell)
    if (row.some((item) => item.trim())) rows.push(row)
  }

  return rows
}

function detectFormat(headers: string[]): BrowserImportFormat {
  const set = new Set(headers.map(normalizeHeader))
  if (set.has('httprealm') || set.has('formactionorigin')) return 'firefox'
  if (set.has('otpauth') || (set.has('title') && set.has('notes'))) return 'safari'
  if (set.has('name') && set.has('url')) return 'chrome'
  if (set.has('url') && set.has('username') && set.has('password')) return 'generic'
  return 'generic'
}

function resolveColumnIndex(headers: string[], aliases: string[]): number {
  const normalized = headers.map(normalizeHeader)
  for (const alias of aliases) {
    const index = normalized.indexOf(alias)
    if (index >= 0) return index
  }
  return -1
}

function titleFromUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return new URL(withScheme).hostname || trimmed
  } catch {
    return trimmed.split('/')[0] || trimmed
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed === 'http://' || trimmed === 'https://') return ''
  return normalizeWebsiteHref(trimmed)
}

function parseCredentialRow(
  cells: string[],
  columns: {
    title: number
    url: number
    username: number
    password: number
    note: number
  }
): ParsedImportCredential | null {
  const password = columns.password >= 0 ? cells[columns.password]?.trim() ?? '' : ''
  if (!password) return null

  const username = columns.username >= 0 ? cells[columns.username]?.trim() ?? '' : ''
  const rawUrl = columns.url >= 0 ? cells[columns.url]?.trim() ?? '' : ''
  const url = normalizeUrl(rawUrl)
  const rawTitle = columns.title >= 0 ? cells[columns.title]?.trim() ?? '' : ''
  const title = rawTitle || titleFromUrl(url) || username || '未命名'
  const note = columns.note >= 0 ? cells[columns.note]?.trim() ?? '' : ''

  return { title, url, username, password, note }
}

export function parsePasswordImportCsv(text: string): PasswordImportParseResult {
  const table = parseCsvRows(text)
  if (table.length < 2) {
    return { format: 'generic', rows: [], skipped: 0 }
  }

  const headers = table[0]
  const format = detectFormat(headers)
  const columns = {
    title: resolveColumnIndex(headers, ['name', 'title', 'site', 'website']),
    url: resolveColumnIndex(headers, ['url', 'website', 'site', 'origin', 'hostname']),
    username: resolveColumnIndex(headers, ['username', 'login', 'email', 'user', 'account']),
    password: resolveColumnIndex(headers, ['password', 'pass']),
    note: resolveColumnIndex(headers, ['note', 'notes', 'comment', 'extra', 'remark'])
  }

  if (columns.password < 0) {
    return { format, rows: [], skipped: table.length - 1 }
  }

  const rows: ParsedImportCredential[] = []
  let skipped = 0

  for (const cells of table.slice(1)) {
    const parsed = parseCredentialRow(cells, columns)
    if (!parsed) {
      skipped++
      continue
    }
    rows.push(parsed)
  }

  return { format, rows, skipped }
}

export function buildLoginImportParams(row: ParsedImportCredential): PasswordEntryParams {
  const websites = row.url ? [row.url] : []
  const title = row.title.trim() || '未命名'

  return {
    passwordType: '登录信息',
    passwordLabels: [],
    passwordTitle: title,
    websites,
    remark: row.note,
    content: {
      title,
      username: row.username,
      password: row.password,
      websites,
      host: '',
      extraFields: []
    }
  }
}
