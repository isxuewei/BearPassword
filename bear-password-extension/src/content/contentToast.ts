import { getContentThemeTokens } from '@/shared/theme/contentTheme'
import { contentToastStyles } from '@/shared/theme/contentStyles'

const TOAST_ID = 'bear-password-content-toast'
const STYLE_ID = 'bear-password-content-toast-style'

let toastTimer: ReturnType<typeof setTimeout> | null = null

function ensureToastStyles(): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = contentToastStyles(TOAST_ID, getContentThemeTokens())
}

export function showContentToast(message: string, durationMs = 2200): void {
  ensureToastStyles()

  let toast = document.getElementById(TOAST_ID)
  if (!toast) {
    toast = document.createElement('div')
    toast.id = TOAST_ID
    document.body.appendChild(toast)
  }

  toast.textContent = message
  toast.classList.add('bear-content-toast--visible')
  document.body.appendChild(toast)

  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast?.classList.remove('bear-content-toast--visible')
  }, durationMs)
}
