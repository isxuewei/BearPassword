import { detectPasswordInputs } from '@/content/formDetector'
import { tContent } from '@/shared/locale/contentLocale'
import { getContentThemeTokens } from '@/shared/theme/contentTheme'
import { passwordFieldIconStyles } from '@/shared/theme/contentStyles'

const STYLE_ID = 'bear-password-field-icon-style'
const WRAPPER_CLASS = 'bear-password-field-wrap'
const ICON_BTN_CLASS = 'bear-password-field-icon'

let onIconClick: ((passwordInput: HTMLInputElement) => void) | null = null

function ensureStyles(): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = passwordFieldIconStyles(getContentThemeTokens())
}

export function refreshPasswordFieldIconStyles(): void {
  const style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (style) {
    style.textContent = passwordFieldIconStyles(getContentThemeTokens())
  }
}

function createIconButton(passwordInput: HTMLInputElement): HTMLButtonElement {
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = ICON_BTN_CLASS
  btn.title = tContent('content.passwordIcon.title')
  btn.setAttribute('aria-label', tContent('content.passwordIcon.title'))
  btn.innerHTML = `<img src="${chrome.runtime.getURL('public/icons/logo.svg')}" alt="" />`

  btn.addEventListener('mousedown', (e) => {
    e.preventDefault()
  })
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    onIconClick?.(passwordInput)
  })

  return btn
}

function attachIcon(passwordInput: HTMLInputElement): void {
  if (passwordInput.dataset.bearPasswordIcon === '1') return

  const parent = passwordInput.parentElement
  if (!parent) return

  let wrapper = passwordInput.closest<HTMLElement>(`.${WRAPPER_CLASS}`)
  if (!wrapper) {
    wrapper = document.createElement('div')
    wrapper.className = WRAPPER_CLASS
    parent.insertBefore(wrapper, passwordInput)
    wrapper.appendChild(passwordInput)
  }

  if (wrapper.querySelector(`.${ICON_BTN_CLASS}`)) {
    passwordInput.dataset.bearPasswordIcon = '1'
    return
  }

  wrapper.appendChild(createIconButton(passwordInput))
  passwordInput.dataset.bearPasswordIcon = '1'
}

export function setupPasswordFieldIcons(
  clickHandler: (passwordInput: HTMLInputElement) => void
): void {
  onIconClick = clickHandler
  ensureStyles()

  for (const input of detectPasswordInputs()) {
    attachIcon(input)
  }
}
