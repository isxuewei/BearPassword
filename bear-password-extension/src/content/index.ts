import type { FillCredential, MatchingCredentialsResult, SaveCredentialPayload } from '@/shared/types'
import { autofillCredential, autofillInContext, getDetectedForms, insertTextAtActiveElement } from '@/content/autofill'
import {
  detectLoginInputs,
  isPasswordInput,
  readContextValues,
  readFormValues,
  resolveLoginContext,
  type LoginFieldContext
} from '@/content/formDetector'
import {
  refreshPasswordFieldIconStyles,
  setupPasswordFieldIcons
} from '@/content/passwordFieldIcon'
import {
  getInlinePickerAnchor,
  hideInlinePicker,
  isInlinePickerVisible,
  reanchorInlinePicker,
  refreshInlinePickerStyles,
  showInlinePicker,
  updateInlinePicker,
  type QuickSaveOptions
} from '@/content/inlinePicker'
import { showSaveBanner } from '@/content/inpageBanner'
import { showContentToast } from '@/content/contentToast'
import { copyCredentialTotpCode } from '@/shared/utils/credentialTotp'
import { sendMessage } from '@/shared/utils/messaging'
import { tContent } from '@/shared/locale/contentLocale'
import {
  initContentAppearance,
  onContentAppearanceChange,
  syncContentAppearanceFromDesktop,
  syncContentAppearanceFromHealth
} from '@/shared/appearance/syncContentAppearance'
import { getBrowserTabTitle } from '@/shared/utils/tabTitle'
import { getPageWebsiteUrl } from '@/shared/utils/websiteMatch'
import { triggerDesktopProtocolUrl } from '@/shared/utils/desktopProtocol'
import {
  onExtensionTeardown,
  runExtensionTeardown,
  startExtensionContextWatch
} from '@/content/extensionLifecycle'
import { isExtensionContextValid } from '@/shared/utils/extensionContext'

let matchingCredentials: FillCredential[] = []
let needsSecurityKey = false
let desktopUnlocked = false
let savePromptShown = false
const contextByInput = new WeakMap<HTMLInputElement, LoginFieldContext>()

const DESKTOP_POLL_MS = 3000
const APPEARANCE_SYNC_MS = 3000
let desktopPollTimer: ReturnType<typeof setInterval> | null = null
let appearanceSyncTimer: ReturnType<typeof setInterval> | null = null

function stopAppearanceSync(): void {
  if (!appearanceSyncTimer) return
  clearInterval(appearanceSyncTimer)
  appearanceSyncTimer = null
}

function refreshContentAppearanceUI(): void {
  refreshInlinePickerStyles()
  refreshPasswordFieldIconStyles()
  void syncOpenPickerAfterRefresh()
}

function startAppearanceSync(): void {
  if (appearanceSyncTimer) return
  appearanceSyncTimer = setInterval(() => {
    void syncContentAppearanceFromDesktop()
  }, APPEARANCE_SYNC_MS)
}

function stopDesktopPoll(): void {
  if (!desktopPollTimer) return
  clearInterval(desktopPollTimer)
  desktopPollTimer = null
}

async function syncOpenPickerAfterRefresh(): Promise<void> {
  if (!isInlinePickerVisible()) return

  const anchor = getInlinePickerAnchor()
  if (!anchor) return

  const context = contextByInput.get(anchor) ?? resolveLoginContext(anchor)
  if (!context) return

  if (!desktopUnlocked) {
    updateInlinePicker([], {
      emptyText: getDesktopNotReadyText(),
      onSelect: () => {},
      quickSave: null
    })
    return
  }

  const { list } = getPickerCredentials()
  const pickerOptions = buildPickerOptions(context)
  if (!hasPickerContent(context, list)) {
    closeInlinePicker()
    return
  }
  updateInlinePicker(list, pickerOptions)
}

async function pollDesktopConnection(): Promise<void> {
  await syncContentAppearanceFromDesktop()
  await refreshCredentials(true)
  await syncOpenPickerAfterRefresh()

  if (desktopUnlocked && !isInlinePickerVisible()) {
    stopDesktopPoll()
  }
}

function startDesktopPoll(): void {
  if (desktopPollTimer) return
  desktopPollTimer = setInterval(() => {
    void pollDesktopConnection()
  }, DESKTOP_POLL_MS)
}

function closeInlinePicker(): void {
  hideInlinePicker()
  stopDesktopPoll()
}

function syncAppearanceFromMatchResult(result: MatchingCredentialsResult): void {
  syncContentAppearanceFromHealth({
    ready: result.desktopReady ?? result.desktopUnlocked,
    loggedIn: result.desktopUnlocked,
    locked: !result.desktopUnlocked,
    unlocked: result.desktopUnlocked,
    username: null,
    themePreference: result.themePreference ?? null,
    localePreference: result.localePreference ?? null
  })
}

async function refreshCredentials(force = false): Promise<void> {
  try {
    const result = await sendMessage<MatchingCredentialsResult>({
      type: 'GET_MATCHING_CREDENTIALS',
      payload: { url: window.location.href, matchBy: 'host', force }
    })
    matchingCredentials = result.credentials
    needsSecurityKey = result.needsSecurityKey
    desktopUnlocked = result.desktopUnlocked
    syncAppearanceFromMatchResult(result)
  } catch {
    matchingCredentials = []
    needsSecurityKey = false
    desktopUnlocked = false
  }
}

async function wakeDesktopFromPage(): Promise<void> {
  try {
    await sendMessage({ type: 'WAKE_DESKTOP' })
  } catch {
    // 忽略唤起失败，picker 仍会提示用户
  }
}

function getDesktopNotReadyText(): string {
  return `${tContent('content.picker.desktopNotReady')}\n${tContent('content.picker.desktopProtocolConfirm')}`
}

let currentPageUrl = window.location.href

function onPageNavigation(): void {
  const nextUrl = window.location.href
  if (nextUrl === currentPageUrl) return

  currentPageUrl = nextUrl
  savePromptShown = false
  closeInlinePicker()
  void refreshCredentials(true)
}

function setupPageNavigationWatcher(): void {
  window.addEventListener('pageshow', () => {
    currentPageUrl = window.location.href
    savePromptShown = false
    void refreshCredentials(true)
  })

  window.addEventListener('popstate', onPageNavigation)

  const wrapHistoryMethod = <T extends History['pushState']>(method: T): T =>
    function (this: History, ...args: Parameters<T>) {
      const result = method.apply(this, args)
      onPageNavigation()
      return result
    } as T

  history.pushState = wrapHistoryMethod(history.pushState)
  history.replaceState = wrapHistoryMethod(history.replaceState)
}

function credentialAlreadyExists(username: string, password: string): boolean {
  return matchingCredentials.some((item) => item.username === username && item.password === password)
}

function getEmptyPickerText(): string {
  if (needsSecurityKey) {
    return tContent('content.picker.needsSecurityKey')
  }
  if (matchingCredentials.length === 0) {
    return tContent('content.picker.noEntries')
  }
  return tContent('content.picker.noMatch')
}

function getQuickSaveOffer(context: LoginFieldContext): QuickSaveOptions | null {
  const { username, password } = readContextValues(context)
  if (!password || credentialAlreadyExists(username, password)) {
    return null
  }
  return {
    username,
    onSave: () => performQuickSave(context)
  }
}

async function performQuickSave(context: LoginFieldContext): Promise<void> {
  const { username, password } = readContextValues(context)
  if (!password || credentialAlreadyExists(username, password)) return

  const title = await getBrowserTabTitle(window.location.hostname)
  const website = getPageWebsiteUrl(window.location.href)

  await sendMessage({
    type: 'SAVE_CREDENTIAL',
    payload: {
      title,
      username,
      password,
      website
    } satisfies SaveCredentialPayload
  })
  await refreshCredentials()
}

function getPickerCredentials(): { list: FillCredential[]; title: string } {
  return { list: matchingCredentials, title: '此网站' }
}

function handleSelect(credential: FillCredential, context: LoginFieldContext): void {
  autofillInContext(credential, context)
  void copyCredentialTotpCode(credential).then((code) => {
    if (code) showContentToast(tContent('content.picker.totpCopied'))
  })
}

function isSameLoginContext(a: LoginFieldContext, b: LoginFieldContext): boolean {
  return a.usernameInput === b.usernameInput && a.passwordInput === b.passwordInput
}

function shouldKeepPickerOnBlur(blurredInput: HTMLInputElement): boolean {
  const active = document.activeElement
  if (!(active instanceof HTMLInputElement)) return false

  const blurredContext = contextByInput.get(blurredInput) ?? resolveLoginContext(blurredInput)
  if (!blurredContext) return false

  const activeContext = resolveLoginContext(active)
  if (!activeContext) return false

  return isSameLoginContext(blurredContext, activeContext)
}

function buildPickerOptions(context: LoginFieldContext) {
  return {
    emptyText: getEmptyPickerText(),
    onSelect: (cred: FillCredential) => handleSelect(cred, context),
    quickSave: getQuickSaveOffer(context)
  }
}

function hasPickerContent(context: LoginFieldContext, list: FillCredential[]): boolean {
  if (!desktopUnlocked) return true
  if (list.length > 0) return true
  if (getQuickSaveOffer(context)) return true
  if (needsSecurityKey) return true
  return false
}

function showDesktopWakePicker(input: HTMLInputElement): void {
  const { title } = getPickerCredentials()
  showInlinePicker(input, [], {
    title,
    emptyText: getDesktopNotReadyText(),
    onSelect: () => {},
    quickSave: null
  })
  startDesktopPoll()
}

async function openPickerForInput(input: HTMLInputElement): Promise<void> {
  const context = resolveLoginContext(input)
  if (!context) return

  await syncContentAppearanceFromDesktop(true)
  refreshContentAppearanceUI()

  contextByInput.set(input, context)

  const anchor = getInlinePickerAnchor()
  if (isInlinePickerVisible() && anchor) {
    const anchorContext = contextByInput.get(anchor) ?? resolveLoginContext(anchor)
    if (anchorContext && isSameLoginContext(anchorContext, context)) {
      await refreshCredentials()
      if (!desktopUnlocked) {
        void wakeDesktopFromPage()
        showDesktopWakePicker(input)
        return
      }
      const { list } = getPickerCredentials()
      const pickerOptions = buildPickerOptions(context)
      if (!hasPickerContent(context, list)) {
        closeInlinePicker()
        return
      }
      reanchorInlinePicker(input, list, pickerOptions)
      return
    }
  }

  await refreshCredentials()

  if (!desktopUnlocked) {
    void wakeDesktopFromPage()
    showDesktopWakePicker(input)
    return
  }

  const { list, title } = getPickerCredentials()
  const pickerOptions = buildPickerOptions(context)

  if (!hasPickerContent(context, list)) {
    closeInlinePicker()
    return
  }

  stopDesktopPoll()
  showInlinePicker(input, list, {
    title,
    ...pickerOptions
  })
}

function refreshOpenPicker(context: LoginFieldContext): void {
  const { list } = getPickerCredentials()
  const pickerOptions = buildPickerOptions(context)
  if (!hasPickerContent(context, list)) {
    closeInlinePicker()
    return
  }
  updateInlinePicker(list, pickerOptions)
}

async function handlePasswordIconClick(passwordInput: HTMLInputElement): Promise<void> {
  if (isInlinePickerVisible() && getInlinePickerAnchor() === passwordInput) {
    closeInlinePicker()
    return
  }
  await openPickerForInput(passwordInput)
}

function setupInputWatcher(input: HTMLInputElement): void {
  if (input.dataset.bearInlineWatched) return
  input.dataset.bearInlineWatched = '1'

  if (isPasswordInput(input)) {
    input.addEventListener('click', () => {
      void openPickerForInput(input)
    })
  }

  input.addEventListener('input', () => {
    if (!isInlinePickerVisible()) return
    const context = contextByInput.get(input) ?? resolveLoginContext(input)
    if (!context) return

    refreshOpenPicker(context)
  })

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!isInlinePickerVisible()) return
      const active = document.activeElement
      const picker = document.getElementById('bear-password-inline-picker')
      if (picker?.contains(active)) return
      if (shouldKeepPickerOnBlur(input)) return
      closeInlinePicker()
    }, 150)
  })

  const form = input.closest('form')
  if (form && !form.dataset.bearSubmitWatched) {
    form.dataset.bearSubmitWatched = '1'
    form.addEventListener('submit', () => {
      setTimeout(() => void handlePossibleSave(), 100)
    })
  }

  if (input.type === 'password') {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        setTimeout(() => void handlePossibleSave(), 300)
      }
    })
  }
}

function setupFormWatchers(): void {
  setupPasswordFieldIcons((passwordInput) => {
    void handlePasswordIconClick(passwordInput)
  })
  for (const input of detectLoginInputs()) {
    setupInputWatcher(input)
  }
}

async function handlePossibleSave(): Promise<void> {
  if (savePromptShown) return

  const forms = getDetectedForms()
  if (!forms.length) return

  const { username, password } = readFormValues(forms[0])
  if (!password) return

  const existing = matchingCredentials.find(
    (c) => c.username === username && c.password === password
  )
  if (existing) return

  savePromptShown = true
  const website = getPageWebsiteUrl(window.location.href)
  showSaveBanner(
    { username, password, website },
    () => {
      void getBrowserTabTitle(window.location.hostname).then((title) =>
        sendMessage({
        type: 'SAVE_CREDENTIAL',
        payload: {
          title,
          username,
          password,
          website
        } satisfies SaveCredentialPayload
        })
      ).then(() => refreshCredentials())
    },
    () => {
      savePromptShown = false
    }
  )
}

interface ContentScriptMessage {
  type: 'PERFORM_AUTOFILL' | 'INSERT_TEXT' | 'TRIGGER_DESKTOP_PROTOCOL'
  payload?: FillCredential | string
}

chrome.runtime.onMessage.addListener((message: ContentScriptMessage, _sender, sendResponse) => {
  if (!isExtensionContextValid()) {
    runExtensionTeardown()
    return false
  }

  switch (message.type) {
    case 'TRIGGER_DESKTOP_PROTOCOL': {
      triggerDesktopProtocolUrl()
      sendResponse({ data: true })
      break
    }
    case 'PERFORM_AUTOFILL': {
      const credential = message.payload as FillCredential
      const ok = autofillCredential(credential)
      void copyCredentialTotpCode(credential).then((code) => {
        if (code) showContentToast(tContent('content.picker.totpCopied'))
      })
      sendResponse({ data: ok })
      break
    }
    case 'INSERT_TEXT': {
      const ok = insertTextAtActiveElement((message.payload as string) ?? '')
      sendResponse({ data: ok })
      break
    }
    default:
      break
  }
  return true
})

async function init(): Promise<void> {
  if (!isExtensionContextValid()) return

  onExtensionTeardown(() => {
    stopAppearanceSync()
    stopDesktopPoll()
  })
  startExtensionContextWatch()

  await initContentAppearance()
  onContentAppearanceChange(refreshContentAppearanceUI)
  startAppearanceSync()
  setupPageNavigationWatcher()
  await refreshCredentials(true)
  setupFormWatchers()

  const observer = new MutationObserver(() => {
    setupFormWatchers()
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void init())
} else {
  void init()
}
