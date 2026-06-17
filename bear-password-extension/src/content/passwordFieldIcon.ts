import { detectPasswordInputs } from '@/content/formDetector'
import { tContent } from '@/shared/locale/contentLocale'
import { getContentThemeTokens } from '@/shared/theme/contentTheme'
import { passwordFieldIconStyles } from '@/shared/theme/contentStyles'

const STYLE_ID = 'bear-password-field-icon-style'
const ICON_HOST_CLASS = 'bear-password-field-icon-host'
const ICON_BTN_CLASS = 'bear-password-field-icon'
const LEGACY_WRAPPER_CLASS = 'bear-password-field-wrap'
const ICON_SIZE = 26
const ICON_INSET = 6

const iconHosts = new WeakMap<HTMLInputElement, HTMLElement>()
const trackedInputs = new Set<HTMLInputElement>()
const resizeObservers = new WeakMap<HTMLInputElement, ResizeObserver>()

let onIconClick: ((passwordInput: HTMLInputElement) => void) | null = null
let scrollHandler: (() => void) | null = null
let resizeHandler: (() => void) | null = null

function ensureStyles(): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = passwordFieldIconStyles(getContentThemeTokens())
}

function ensurePositionListeners(): void {
  if (scrollHandler) return
  scrollHandler = () => positionAllIcons()
  resizeHandler = scrollHandler
  window.addEventListener('scroll', scrollHandler, true)
  window.addEventListener('resize', resizeHandler)
}

function isInputVisible(input: HTMLInputElement): boolean {
  if (!document.contains(input)) return false
  const style = getComputedStyle(input)
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
    return false
  }
  const rect = input.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

function positionIconHost(host: HTMLElement, input: HTMLInputElement): void {
  if (!isInputVisible(input)) {
    host.style.display = 'none'
    return
  }

  const rect = input.getBoundingClientRect()
  host.style.display = 'block'
  host.style.top = `${rect.top + (rect.height - ICON_SIZE) / 2}px`
  host.style.left = `${Math.max(0, rect.right - ICON_SIZE - ICON_INSET)}px`
  host.style.width = `${ICON_SIZE}px`
  host.style.height = `${ICON_SIZE}px`
}

function removeIcon(input: HTMLInputElement): void {
  resizeObservers.get(input)?.disconnect()
  resizeObservers.delete(input)

  iconHosts.get(input)?.remove()
  iconHosts.delete(input)
  trackedInputs.delete(input)
}

export function cleanupLegacyWrappers(): void {
  for (const wrapper of document.querySelectorAll<HTMLElement>(`.${LEGACY_WRAPPER_CLASS}`)) {
    const input = wrapper.querySelector<HTMLInputElement>('input[type="password"]')
    if (input?.parentElement === wrapper) {
      wrapper.parentElement?.insertBefore(input, wrapper)
    }
    wrapper.remove()
  }

  for (const icon of document.querySelectorAll<HTMLElement>(`.${ICON_BTN_CLASS}`)) {
    if (icon.closest(`.${LEGACY_WRAPPER_CLASS}`)) continue
    if (icon.parentElement?.classList.contains(ICON_HOST_CLASS)) continue
    icon.remove()
  }
}

function ensureResizeObserver(input: HTMLInputElement): void {
  if (resizeObservers.has(input)) return

  const observer = new ResizeObserver(() => {
    const host = iconHosts.get(input)
    if (host) positionIconHost(host, input)
  })
  observer.observe(input)
  resizeObservers.set(input, observer)
}

function createIconHost(passwordInput: HTMLInputElement): HTMLElement {
  const host = document.createElement('div')
  host.className = ICON_HOST_CLASS

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

  host.appendChild(btn)
  return host
}

function attachIcon(passwordInput: HTMLInputElement): void {
  let host = iconHosts.get(passwordInput)
  if (!host) {
    host = createIconHost(passwordInput)
    document.body.appendChild(host)
    iconHosts.set(passwordInput, host)
    ensurePositionListeners()
    ensureResizeObserver(passwordInput)
  }

  trackedInputs.add(passwordInput)
  positionIconHost(host, passwordInput)
}

export function positionAllIcons(): void {
  for (const input of [...trackedInputs]) {
    if (!document.contains(input) || input.type !== 'password') {
      removeIcon(input)
      continue
    }
    const host = iconHosts.get(input)
    if (host) positionIconHost(host, input)
  }
}

export function refreshPasswordFieldIconStyles(): void {
  ensureStyles()
  positionAllIcons()
}

export function setupPasswordFieldIcons(
  clickHandler: (passwordInput: HTMLInputElement) => void
): void {
  onIconClick = clickHandler
  ensureStyles()
  cleanupLegacyWrappers()

  for (const input of detectPasswordInputs()) {
    attachIcon(input)
  }
  positionAllIcons()
}
