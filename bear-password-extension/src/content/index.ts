import type { FillCredential, MatchingCredentialsResult, SaveCredentialPayload } from '@/shared/types'
import { autofillCredential, autofillInContext, getDetectedForms, insertTextAtActiveElement } from '@/content/autofill'
import {
  detectLoginInputs,
  readContextValues,
  readFormValues,
  resolveLoginContext,
  type LoginFieldContext
} from '@/content/formDetector'
import {
  hideInlinePicker,
  isInlinePickerVisible,
  refreshInlinePickerStyles,
  showInlinePicker,
  updateInlinePicker,
  type QuickSaveOptions
} from '@/content/inlinePicker'
import { showSaveBanner } from '@/content/inpageBanner'
import { sendMessage } from '@/shared/utils/messaging'
import {
  applyContentLocalePreference,
  initContentLocale,
  tContent
} from '@/shared/locale/contentLocale'
import { applyContentThemePreference, initContentTheme } from '@/shared/theme/contentTheme'
import { getBrowserTabTitle } from '@/shared/utils/tabTitle'
import { getPageHostLabel } from '@/shared/utils/websiteMatch'

let matchingCredentials: FillCredential[] = []
let needsSecurityKey = false
let savePromptShown = false
const contextByInput = new WeakMap<HTMLInputElement, LoginFieldContext>()

async function refreshCredentials(): Promise<void> {
  try {
    const result = await sendMessage<MatchingCredentialsResult>({
      type: 'GET_MATCHING_CREDENTIALS',
      payload: { url: window.location.href }
    })
    matchingCredentials = result.credentials
    needsSecurityKey = result.needsSecurityKey
  } catch {
    matchingCredentials = []
    needsSecurityKey = false
  }
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
  const website = getPageHostLabel(window.location.href)

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

function getPickerCredentials(filterText = ''): { list: FillCredential[]; title: string } {
  const q = filterText.trim().toLowerCase()
  const list = q
    ? matchingCredentials.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.username.toLowerCase().includes(q)
      )
    : matchingCredentials
  return { list, title: '此网站' }
}

function handleSelect(credential: FillCredential, context: LoginFieldContext): void {
  autofillInContext(credential, context)
}

async function openPickerForInput(input: HTMLInputElement): Promise<void> {
  const context = resolveLoginContext(input)
  if (!context) return

  contextByInput.set(input, context)
  await refreshCredentials()

  const filterText = context.usernameInput?.value ?? ''
  const { list, title } = getPickerCredentials(filterText)

  showInlinePicker(input, list, {
    title,
    emptyText: getEmptyPickerText(),
    onSelect: (cred) => handleSelect(cred, context),
    quickSave: getQuickSaveOffer(context)
  })
}

function refreshOpenPicker(context: LoginFieldContext, filterText: string): void {
  const { list } = getPickerCredentials(filterText)
  updateInlinePicker(list, {
    emptyText: getEmptyPickerText(),
    onSelect: (cred) => handleSelect(cred, context),
    quickSave: getQuickSaveOffer(context)
  })
}

function setupInputWatcher(input: HTMLInputElement): void {
  if (input.dataset.bearInlineWatched) return
  input.dataset.bearInlineWatched = '1'

  input.addEventListener('focus', () => {
    void openPickerForInput(input)
  })

  input.addEventListener('input', () => {
    if (!isInlinePickerVisible()) return
    const context = contextByInput.get(input) ?? resolveLoginContext(input)
    if (!context) return

    refreshOpenPicker(context, context.usernameInput?.value ?? '')
  })

  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (!isInlinePickerVisible()) return
      const active = document.activeElement
      const picker = document.getElementById('bear-password-inline-picker')
      if (picker?.contains(active)) return
      hideInlinePicker()
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
  const website = getPageHostLabel(window.location.href)
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
  type: 'PERFORM_AUTOFILL' | 'INSERT_TEXT'
  payload?: FillCredential | string
}

chrome.runtime.onMessage.addListener((message: ContentScriptMessage, _sender, sendResponse) => {
  switch (message.type) {
    case 'PERFORM_AUTOFILL': {
      const ok = autofillCredential(message.payload as FillCredential)
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
  await Promise.all([initContentTheme(), initContentLocale()])
  await refreshCredentials()
  setupFormWatchers()

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    if (changes.bear_extension_theme) {
      applyContentThemePreference(changes.bear_extension_theme.newValue)
      refreshInlinePickerStyles()
    }
    if (changes.bear_extension_locale) {
      applyContentLocalePreference(changes.bear_extension_locale.newValue)
      refreshInlinePickerStyles()
    }
  })

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
