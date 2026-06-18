import type { FillCredential } from '@/shared/types'

export interface CredentialShareLabels {
  website: string
  username: string
  password: string
  footer: string
}

function formatWebsitesDisplay(websites: string[]): string {
  return websites.map((url) => url.trim()).filter(Boolean).join(', ')
}

/** 与桌面端 buildEntryCopyText 登录项分享格式保持一致 */
export function buildCredentialShareText(
  credential: FillCredential,
  labels: CredentialShareLabels
): string {
  const lines: string[] = []

  const websiteDisplay = formatWebsitesDisplay(credential.websites)
  if (websiteDisplay) {
    lines.push(`${labels.website}: ${websiteDisplay}`)
  }

  const username = credential.username.trim()
  if (username) {
    lines.push(`${labels.username}: ${username}`)
  }

  if (credential.password) {
    lines.push(`${labels.password}: ${credential.password}`)
  }

  lines.push('')
  lines.push(labels.footer)
  return lines.join('\n')
}
