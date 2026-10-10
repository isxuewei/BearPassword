import type { LoginContent, PasswordEntry } from '@/types'
import { resolveEntryTitle } from '@/utils/passwordTitle'
import { resolveEntryWebsites } from '@/utils/passwordWebsites'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

const CHROME_PASSWORD_HEADERS = ['name', 'url', 'username', 'password', 'note'] as const

function escapeCsvField(value: unknown): string {
  const text = String(value ?? '')
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

/** 将登录信息转换为 Chrome 密码管理器兼容的 CSV。 */
export function buildChromePasswordCsv(entries: PasswordEntry[]): { content: string; rowCount: number } {
  const rows: string[][] = []

  entries.forEach((entry) => {
    if (resolveEntryType(entry) !== '登录信息') return

    const content = entry.content as LoginContent
    const websites = resolveEntryWebsites(entry)
    const urls = websites.length ? websites : ['']

    urls.forEach((url) => {
      rows.push([
        resolveEntryTitle(entry),
        url,
        String(content.username ?? ''),
        String(content.password ?? ''),
        entry.remark ?? ''
      ])
    })
  })

  const lines = [CHROME_PASSWORD_HEADERS, ...rows]
  return {
    content: lines.map((line) => line.map(escapeCsvField).join(',')).join('\r\n'),
    rowCount: rows.length
  }
}
