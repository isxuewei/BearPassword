/**
 * 密码库列表排序（参考 1Password）
 */
import type { PasswordEntry } from '@/types'

export type VaultSortField = 'title' | 'createTime' | 'updateTime' | 'recent'
export type VaultSortOrder = 'asc' | 'desc'

export interface VaultSortState {
  field: VaultSortField
  order: VaultSortOrder
}

export interface VaultEntryGroup {
  label: string
  entries: PasswordEntry[]
}

const SORT_STORAGE_KEY = 'bear-vault-sort'
const RECENT_STORAGE_KEY = 'bear-vault-recent-access'

export const VAULT_SORT_FIELD_OPTIONS: { label: string; value: VaultSortField }[] = [
  { label: '标题', value: 'title' },
  { label: '创建日期', value: 'createTime' },
  { label: '修改日期', value: 'updateTime' },
  { label: '最近使用的', value: 'recent' }
]

export function getVaultSortOrderOptions(field: VaultSortField): { label: string; value: VaultSortOrder }[] {
  if (field === 'title') {
    return [
      { label: '按字母顺序', value: 'asc' },
      { label: '字母倒序', value: 'desc' }
    ]
  }
  return [
    { label: '最新优先', value: 'desc' },
    { label: '最早优先', value: 'asc' }
  ]
}

export function loadVaultSort(): VaultSortState {
  const defaultSort: VaultSortState = { field: 'createTime', order: 'desc' }
  try {
    const raw = localStorage.getItem(SORT_STORAGE_KEY)
    if (!raw) return defaultSort
    const parsed = JSON.parse(raw) as Partial<VaultSortState>
    const field = VAULT_SORT_FIELD_OPTIONS.some((item) => item.value === parsed.field)
      ? (parsed.field as VaultSortField)
      : defaultSort.field
    const order = parsed.order === 'asc' || parsed.order === 'desc' ? parsed.order : defaultSort.order
    return { field, order }
  } catch {
    return defaultSort
  }
}

export function saveVaultSort(state: VaultSortState): void {
  localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(state))
}

export function recordRecentAccess(entryId: number): void {
  const map = loadRecentAccessMap()
  map[String(entryId)] = Date.now()
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(map))
}

function loadRecentAccessMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, number>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function getRecentAccessTime(entryId: number): number {
  return loadRecentAccessMap()[String(entryId)] ?? 0
}

function compareStrings(a: string, b: string, order: VaultSortOrder): number {
  const result = a.localeCompare(b, 'zh-CN', { sensitivity: 'base' })
  return order === 'asc' ? result : -result
}

function compareNumbers(a: number, b: number, order: VaultSortOrder): number {
  return order === 'asc' ? a - b : b - a
}

function getTitleGroupKey(title: string): string {
  const trimmed = title.trim()
  if (!trimmed) return '#'
  const char = trimmed[0].toUpperCase()
  if (/[A-Z]/.test(char)) return char
  if (/[0-9]/.test(char)) return '#'
  return trimmed[0]
}

function formatMonthLabel(dateStr?: string): string {
  if (!dateStr) return '未分类'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return '未分类'
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

function getDateValue(entry: PasswordEntry, field: 'createTime' | 'updateTime'): number {
  const value = field === 'createTime' ? entry.createTime : entry.updateTime || entry.createTime
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function sortEntries(
  list: PasswordEntry[],
  sort: VaultSortState,
  getTitle: (entry: PasswordEntry) => string
): PasswordEntry[] {
  const copied = [...list]
  copied.sort((a, b) => {
    switch (sort.field) {
      case 'title':
        return compareStrings(getTitle(a), getTitle(b), sort.order)
      case 'createTime':
        return compareNumbers(getDateValue(a, 'createTime'), getDateValue(b, 'createTime'), sort.order)
      case 'updateTime':
        return compareNumbers(getDateValue(a, 'updateTime'), getDateValue(b, 'updateTime'), sort.order)
      case 'recent':
        return compareNumbers(getRecentAccessTime(a.id), getRecentAccessTime(b.id), sort.order)
      default:
        return 0
    }
  })
  return copied
}

function groupByTitle(list: PasswordEntry[], sort: VaultSortState, getTitle: (entry: PasswordEntry) => string): VaultEntryGroup[] {
  const groups = new Map<string, PasswordEntry[]>()
  for (const entry of sortEntries(list, sort, getTitle)) {
    const key = getTitleGroupKey(getTitle(entry))
    const bucket = groups.get(key) ?? []
    bucket.push(entry)
    groups.set(key, bucket)
  }

  const keys = Array.from(groups.keys()).sort((a, b) => {
    if (a === '#') return 1
    if (b === '#') return -1
    return sort.order === 'asc' ? a.localeCompare(b, 'zh-CN') : b.localeCompare(a, 'zh-CN')
  })

  return keys.map((label) => ({ label, entries: groups.get(label) ?? [] }))
}

function groupByMonth(
  list: PasswordEntry[],
  sort: VaultSortState,
  getTitle: (entry: PasswordEntry) => string,
  dateField: 'createTime' | 'updateTime'
): VaultEntryGroup[] {
  const groups = new Map<string, { entries: PasswordEntry[]; sortKey: number }>()
  for (const entry of sortEntries(list, sort, getTitle)) {
    const dateStr = dateField === 'createTime' ? entry.createTime : entry.updateTime || entry.createTime
    const label = formatMonthLabel(dateStr)
    const sortKey = getDateValue(entry, dateField)
    const bucket = groups.get(label) ?? { entries: [], sortKey: 0 }
    bucket.entries.push(entry)
    bucket.sortKey = Math.max(bucket.sortKey, sortKey)
    groups.set(label, bucket)
  }

  return Array.from(groups.entries())
    .sort(([, a], [, b]) => (sort.order === 'desc' ? b.sortKey - a.sortKey : a.sortKey - b.sortKey))
    .map(([label, { entries: groupEntries }]) => ({ label, entries: groupEntries }))
}

function groupRecent(list: PasswordEntry[], sort: VaultSortState, getTitle: (entry: PasswordEntry) => string): VaultEntryGroup[] {
  const sorted = sortEntries(list, sort, getTitle)
  const withAccess = sorted.filter((entry) => getRecentAccessTime(entry.id) > 0)
  const withoutAccess = sorted.filter((entry) => getRecentAccessTime(entry.id) === 0)

  const groups: VaultEntryGroup[] = []
  if (withAccess.length) {
    groups.push({ label: '最近使用', entries: withAccess })
  }
  if (withoutAccess.length) {
    groups.push({ label: '尚未使用', entries: withoutAccess })
  }
  return groups
}

export function sortAndGroupEntries(
  list: PasswordEntry[],
  sort: VaultSortState,
  getTitle: (entry: PasswordEntry) => string
): VaultEntryGroup[] {
  if (!list.length) return []

  switch (sort.field) {
    case 'title':
      return groupByTitle(list, sort, getTitle)
    case 'createTime':
      return groupByMonth(list, sort, getTitle, 'createTime')
    case 'updateTime':
      return groupByMonth(list, sort, getTitle, 'updateTime')
    case 'recent':
      return groupRecent(list, sort, getTitle)
    default:
      return [{ label: '', entries: sortEntries(list, sort, getTitle) }]
  }
}
