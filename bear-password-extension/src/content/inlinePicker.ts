import type { AuthenticatorContent, FillCredential } from '@/shared/types'
import { tContent } from '@/shared/locale/contentLocale'
import { getContentThemeTokens } from '@/shared/theme/contentTheme'
import { inlinePickerStyles } from '@/shared/theme/contentStyles'
import { generateTotpSnapshot } from '@/shared/utils/totp'
import { copyCredentialTotpCode, copyCredentialTotpCodeSync } from '@/shared/utils/credentialTotp'
import { showContentToast } from '@/content/contentToast'

const PICKER_ID = 'bear-password-inline-picker'
const STYLE_ID = 'bear-password-inline-picker-style'
const PICKER_OFFSET_X = 14
const PICKER_OFFSET_Y = 14

export interface QuickSaveOptions {
  username: string
  onSave: () => void | Promise<void>
}

export interface InlinePickerOptions {
  title: string
  emptyText?: string
  onSelect: (credential: FillCredential) => void
  quickSave?: QuickSaveOptions | null
  onEmptyClick?: () => void | Promise<void>
}

let scrollHandler: (() => void) | null = null
let resizeHandler: (() => void) | null = null
let anchorInput: HTMLInputElement | null = null
let totpTimer: ReturnType<typeof setInterval> | null = null
const totpCredentials = new Map<string, AuthenticatorContent>()

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function ensureStyles(): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = inlinePickerStyles(PICKER_ID, getContentThemeTokens())
}

export function refreshInlinePickerStyles(): void {
  ensureStyles()
}

function positionPicker(picker: HTMLElement, anchor: HTMLInputElement): void {
  const rect = anchor.getBoundingClientRect()
  const pickerWidth = picker.offsetWidth || 300
  const pickerHeight = picker.offsetHeight || 200

  let top = rect.bottom + PICKER_OFFSET_Y
  let left = rect.left + PICKER_OFFSET_X

  if (left + pickerWidth > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - pickerWidth - 8)
  }
  if (top + pickerHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - pickerHeight - PICKER_OFFSET_Y)
  }

  picker.style.top = `${top}px`
  picker.style.left = `${left}px`
  picker.style.width = `${Math.max(rect.width, 300)}px`
}

function renderQuickSaveFooter(picker: HTMLElement, quickSave: QuickSaveOptions | null | undefined): void {
  picker.querySelector('.bear-picker-footer')?.remove()
  if (!quickSave) return

  const footer = document.createElement('div')
  footer.className = 'bear-picker-footer'
  footer.innerHTML = `
    <div class="bear-picker-quick-hint">${escapeHtml(tContent('content.picker.quickSaveHint'))}</div>
    <button type="button" class="bear-picker-quick-save">${escapeHtml(tContent('content.picker.quickSave'))}</button>
  `

  const saveBtn = footer.querySelector('.bear-picker-quick-save') as HTMLButtonElement | null
  saveBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (saveBtn.disabled) return
    saveBtn.disabled = true
    saveBtn.textContent = tContent('content.picker.saving')
    const hint = footer.querySelector('.bear-picker-quick-hint')
    void Promise.resolve(quickSave.onSave())
      .then(() => {
        if (hint) {
          hint.textContent = tContent('content.picker.saveSuccess')
          hint.classList.add('bear-picker-quick-hint--success')
        }
        saveBtn.textContent = tContent('content.picker.saved')
        saveBtn.classList.add('bear-picker-quick-save--success')
        window.setTimeout(() => hideInlinePicker(), 1600)
      })
      .catch(() => {
        saveBtn.disabled = false
        saveBtn.textContent = tContent('content.picker.quickSave')
        saveBtn.classList.remove('bear-picker-quick-save--success')
        if (hint) {
          hint.textContent = tContent('content.picker.saveFailed')
          hint.classList.remove('bear-picker-quick-hint--success')
        }
      })
  })

  picker.appendChild(footer)
}

function syncTotpCredentials(credentials: FillCredential[]): void {
  totpCredentials.clear()
  for (const cred of credentials) {
    if (cred.authenticator) {
      totpCredentials.set(cred.id, cred.authenticator)
    }
  }
}

function renderTotpRing(snapshot: ReturnType<typeof generateTotpSnapshot>): string {
  const countdown = snapshot ? String(snapshot.remainingSeconds).padStart(2, '0') : '--'
  const ringOffset = snapshot ? 97.4 * (1 - snapshot.remainingSeconds / snapshot.period) : 97.4

  return `
    <span class="bear-picker-item-totp-ring" aria-hidden="true">
      <svg viewBox="0 0 36 36">
        <g class="bear-picker-item-totp-ring-rotate">
          <circle class="bear-picker-item-totp-ring-track" cx="18" cy="18" r="15.5" />
          <circle
            class="bear-picker-item-totp-ring-progress"
            cx="18"
            cy="18"
            r="15.5"
            style="stroke-dashoffset: ${ringOffset}"
          />
        </g>
        <text class="bear-picker-item-totp-countdown" x="18" y="18" text-anchor="middle" dominant-baseline="central">${countdown}</text>
      </svg>
    </span>
  `
}

function refreshTotpDisplays(picker: HTMLElement): void {
  const nowMs = Date.now()

  for (const [credId, auth] of totpCredentials) {
    const totpEl = picker.querySelector<HTMLElement>(`.bear-picker-item-totp[data-cred-id="${credId}"]`)
    if (!totpEl) continue

    const snapshot = generateTotpSnapshot(auth, nowMs)
    const codeEl = totpEl.querySelector('.bear-picker-item-totp-code')
    const countdownEl = totpEl.querySelector('.bear-picker-item-totp-countdown')
    const progressEl = totpEl.querySelector('.bear-picker-item-totp-ring-progress') as SVGCircleElement | null

    if (codeEl) codeEl.textContent = snapshot?.code ?? '------'
    if (countdownEl) {
      countdownEl.textContent = snapshot ? String(snapshot.remainingSeconds).padStart(2, '0') : '--'
    }
    if (progressEl && snapshot) {
      progressEl.style.strokeDashoffset = String(97.4 * (1 - snapshot.remainingSeconds / snapshot.period))
    }
  }
}

function stopTotpTimer(): void {
  if (totpTimer) {
    clearInterval(totpTimer)
    totpTimer = null
  }
  totpCredentials.clear()
}

function startTotpTimer(credentials: FillCredential[]): void {
  if (totpTimer) {
    clearInterval(totpTimer)
    totpTimer = null
  }

  syncTotpCredentials(credentials)
  if (totpCredentials.size === 0) return

  totpTimer = setInterval(() => {
    const activePicker = document.getElementById(PICKER_ID)
    if (!activePicker) {
      stopTotpTimer()
      return
    }
    refreshTotpDisplays(activePicker)
  }, 1000)
}

function handleTotpCopy(cred: FillCredential): void {
  const copiedCode = copyCredentialTotpCodeSync(cred, document)
  if (copiedCode) {
    showContentToast(tContent('content.picker.totpCopied'))
    return
  }

  void copyCredentialTotpCode(cred, document).then((code) => {
    showContentToast(
      code ? tContent('content.picker.totpCopied') : tContent('content.picker.totpCopyFailed')
    )
  })
}

function renderList(
  listEl: HTMLElement,
  credentials: FillCredential[],
  onSelect: (credential: FillCredential) => void
): void {
  listEl.innerHTML = ''
  for (const cred of credentials) {
    const item = document.createElement('div')
    item.className = 'bear-picker-item'

    const info = document.createElement('div')
    info.className = 'bear-picker-item-info'
    info.innerHTML = `
      <div class="bear-picker-item-title">${escapeHtml(cred.title)}</div>
      <div class="bear-picker-item-user">${escapeHtml(cred.username || tContent('content.picker.noUsername'))}</div>
    `
    info.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect(cred)
      hideInlinePicker()
    })

    item.appendChild(info)

    if (cred.authenticator) {
      const snapshot = generateTotpSnapshot(cred.authenticator)
      const code = snapshot?.code ?? '------'
      const totp = document.createElement('button')
      totp.type = 'button'
      totp.className = 'bear-picker-item-totp'
      totp.dataset.credId = cred.id
      totp.title = tContent('content.picker.totpCopy')
      totp.innerHTML = `
        <span class="bear-picker-item-totp-code">${escapeHtml(code)}</span>
        ${renderTotpRing(snapshot)}
      `
      totp.addEventListener('mousedown', (e) => {
        e.stopPropagation()
      })
      totp.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        handleTotpCopy(cred)
      })
      item.appendChild(totp)
    }

    listEl.appendChild(item)
  }
}

export function showInlinePicker(
  anchor: HTMLInputElement,
  credentials: FillCredential[],
  options: InlinePickerOptions
): void {
  hideInlinePicker()
  ensureStyles()
  anchorInput = anchor

  const picker = document.createElement('div')
  picker.id = PICKER_ID
  picker.setAttribute('role', 'listbox')

  const header = document.createElement('div')
  header.className = 'bear-picker-header'
  header.innerHTML = `
    <img class="bear-picker-logo" src="${chrome.runtime.getURL('public/icons/logo.svg')}" alt="" />
    <span class="bear-picker-title">BearPassword · ${escapeHtml(options.title)}</span>
    <span class="bear-picker-count">${escapeHtml(tContent('content.picker.itemCount', { count: credentials.length }))}</span>
  `

  const list = document.createElement('div')
  list.className = 'bear-picker-list'

  if (!credentials.length) {
    const emptyDiv = document.createElement('div')
    emptyDiv.className = 'bear-picker-empty'
    emptyDiv.innerHTML = escapeHtml(options.emptyText ?? tContent('content.picker.emptyDefault'))
    if (options.onEmptyClick) {
      emptyDiv.style.cursor = 'pointer'
      emptyDiv.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        options.onEmptyClick?.()
      })
    }
    list.appendChild(emptyDiv)
    stopTotpTimer()
  } else {
    renderList(list, credentials, options.onSelect)
    startTotpTimer(credentials)
  }

  picker.appendChild(header)
  picker.appendChild(list)
  renderQuickSaveFooter(picker, options.quickSave)

  picker.addEventListener('mousedown', (e) => {
    const target = e.target as HTMLElement
    if (target.closest('.bear-picker-item-totp, .bear-picker-quick-save')) return
    e.preventDefault()
  })

  document.body.appendChild(picker)
  positionPicker(picker, anchor)

  scrollHandler = () => {
    if (anchorInput && document.getElementById(PICKER_ID)) {
      positionPicker(document.getElementById(PICKER_ID)!, anchorInput)
    }
  }
  resizeHandler = scrollHandler
  window.addEventListener('scroll', scrollHandler, true)
  window.addEventListener('resize', resizeHandler)
}

export function getInlinePickerAnchor(): HTMLInputElement | null {
  return anchorInput
}

/** 同一登录表单内切换输入框时，更新锚点与内容，避免销毁重建导致闪烁 */
export function reanchorInlinePicker(
  anchor: HTMLInputElement,
  credentials: FillCredential[],
  options: {
    emptyText: string
    onSelect: (c: FillCredential) => void
    quickSave?: QuickSaveOptions | null
    onEmptyClick?: () => void | Promise<void>
  }
): void {
  anchorInput = anchor
  const picker = document.getElementById(PICKER_ID)
  if (!picker) return
  updateInlinePicker(credentials, options)
}

export function updateInlinePicker(
  credentials: FillCredential[],
  options: {
    emptyText: string
    onSelect: (c: FillCredential) => void
    quickSave?: QuickSaveOptions | null
    onEmptyClick?: () => void | Promise<void>
  }
): void {
  const picker = document.getElementById(PICKER_ID)
  if (!picker) return

  const countEl = picker.querySelector('.bear-picker-count')
  if (countEl) countEl.textContent = tContent('content.picker.itemCount', { count: credentials.length })

  const list = picker.querySelector('.bear-picker-list')
  if (!list) return

  if (!credentials.length) {
    list.innerHTML = ''
    const emptyDiv = document.createElement('div')
    emptyDiv.className = 'bear-picker-empty'
    emptyDiv.innerHTML = escapeHtml(options.emptyText)
    if (options.onEmptyClick) {
      emptyDiv.style.cursor = 'pointer'
      emptyDiv.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        options.onEmptyClick?.()
      })
    }
    list.appendChild(emptyDiv)
    stopTotpTimer()
  } else {
    renderList(list as HTMLElement, credentials, options.onSelect)
    startTotpTimer(credentials)
  }

  renderQuickSaveFooter(picker, options.quickSave)

  if (anchorInput) {
    positionPicker(picker, anchorInput)
  }
}

/** @deprecated 使用 updateInlinePicker */
export function updateInlinePickerList(credentials: FillCredential[], onSelect: (c: FillCredential) => void): void {
  updateInlinePicker(credentials, {
    emptyText: tContent('content.picker.noMatch'),
    onSelect
  })
}

export function hideInlinePicker(): void {
  stopTotpTimer()
  document.getElementById(PICKER_ID)?.remove()
  anchorInput = null
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler, true)
    scrollHandler = null
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
}

export function isInlinePickerVisible(): boolean {
  return !!document.getElementById(PICKER_ID)
}
