import type { FillCredential } from '@/shared/types'
import { tContent } from '@/shared/locale/contentLocale'
import { getContentThemeTokens } from '@/shared/theme/contentTheme'
import { inlinePickerStyles } from '@/shared/theme/contentStyles'

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
}

let scrollHandler: (() => void) | null = null
let resizeHandler: (() => void) | null = null
let anchorInput: HTMLInputElement | null = null

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
  picker.style.width = `${Math.max(rect.width, 280)}px`
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

function renderList(
  listEl: HTMLElement,
  credentials: FillCredential[],
  onSelect: (credential: FillCredential) => void
): void {
  listEl.innerHTML = ''
  for (const cred of credentials) {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'bear-picker-item'
    item.innerHTML = `
      <div class="bear-picker-item-title">${escapeHtml(cred.title)}</div>
      <div class="bear-picker-item-user">${escapeHtml(cred.username || tContent('content.picker.noUsername'))}</div>
    `
    item.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect(cred)
      hideInlinePicker()
    })
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
    list.innerHTML = `<div class="bear-picker-empty">${escapeHtml(options.emptyText ?? tContent('content.picker.emptyDefault'))}</div>`
  } else {
    renderList(list, credentials, options.onSelect)
  }

  picker.appendChild(header)
  picker.appendChild(list)
  renderQuickSaveFooter(picker, options.quickSave)

  picker.addEventListener('mousedown', (e) => {
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
  }
): void {
  const picker = document.getElementById(PICKER_ID)
  if (!picker) return

  const countEl = picker.querySelector('.bear-picker-count')
  if (countEl) countEl.textContent = tContent('content.picker.itemCount', { count: credentials.length })

  const list = picker.querySelector('.bear-picker-list')
  if (!list) return

  if (!credentials.length) {
    list.innerHTML = `<div class="bear-picker-empty">${escapeHtml(options.emptyText)}</div>`
  } else {
    renderList(list as HTMLElement, credentials, options.onSelect)
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
