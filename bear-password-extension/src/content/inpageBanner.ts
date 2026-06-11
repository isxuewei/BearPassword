import { tContent } from '@/shared/locale/contentLocale'
import { getContentThemeTokens } from '@/shared/theme/contentTheme'
import { saveBannerStyles } from '@/shared/theme/contentStyles'

const BANNER_ID = 'bear-password-save-banner'

export interface SaveBannerData {
  username: string
  password: string
  website: string
}

function getBannerStyles(): string {
  return saveBannerStyles(BANNER_ID, getContentThemeTokens())
}

export function showSaveBanner(
  data: SaveBannerData,
  onSave: () => void,
  onDismiss: () => void
): void {
  removeSaveBanner()

  const style = document.createElement('style')
  style.textContent = getBannerStyles()
  document.head.appendChild(style)

  const banner = document.createElement('div')
  banner.id = BANNER_ID
  banner.innerHTML = `
    <div class="bear-title">${escapeHtml(tContent('content.banner.title'))}</div>
    <div class="bear-desc">${escapeHtml(
      tContent('content.banner.desc', {
        username: data.username || tContent('content.banner.unknownUser')
      })
    )}</div>
    <div class="bear-actions">
      <button class="bear-save" type="button">${escapeHtml(tContent('content.banner.save'))}</button>
      <button class="bear-dismiss" type="button">${escapeHtml(tContent('content.banner.dismiss'))}</button>
    </div>
  `

  banner.querySelector('.bear-save')?.addEventListener('click', () => {
    onSave()
    removeSaveBanner()
  })
  banner.querySelector('.bear-dismiss')?.addEventListener('click', () => {
    onDismiss()
    removeSaveBanner()
  })

  document.body.appendChild(banner)
}

export function removeSaveBanner(): void {
  document.getElementById(BANNER_ID)?.remove()
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
