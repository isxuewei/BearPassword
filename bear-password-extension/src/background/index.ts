import {
  createCredentialApi,
  deleteCredentialApi,
  getCredentialApi,
  getDesktopHealthApi,
  getMatchingCredentialsApi,
  probeDesktopBridge,
  toggleFavoriteApi,
  updateCredentialApi,
  wakeDesktopApi
} from '@/shared/api/desktopBridge'
import type {
  AutofillPayload,
  DesktopConnectionState,
  ExtensionMessage,
  FillCredential,
  MatchingCredentialsPayload,
  MatchingCredentialsResult,
  SaveCredentialPayload,
  UpdateCredentialPayload,
  UpsertCredentialPayload,
  WebsiteMatchMode
} from '@/shared/types'
import { generatePassword } from '@/shared/utils/passwordGenerator'

interface CredentialsCacheEntry {
  result: MatchingCredentialsResult
  timestamp: number
}

const credentialsCache = new Map<string, CredentialsCacheEntry>()
const CACHE_TTL = 60_000

let cachedHealth: DesktopConnectionState | null = null

function clearCredentialsCache(): void {
  credentialsCache.clear()
}

async function getDesktopState(force = false): Promise<DesktopConnectionState | null> {
  if (force) {
    cachedHealth = null
  }
  try {
    cachedHealth = force ? await probeDesktopBridge() : await getDesktopHealthApi()
    return cachedHealth
  } catch {
    cachedHealth = {
      ready: false,
      loggedIn: false,
      locked: false,
      unlocked: false,
      username: null,
      themePreference: null,
      localePreference: null
    }
    return cachedHealth
  }
}

async function assertDesktopUnlocked(): Promise<DesktopConnectionState> {
  const state = await getDesktopState(true)
  if (!state?.ready) {
    throw new Error('无法连接 BearPassword 桌面端，请先启动桌面应用')
  }
  if (!state.loggedIn) {
    throw new Error('请先在桌面端登录')
  }
  if (state.locked) {
    throw new Error('桌面端已锁定，请先解锁保险库')
  }
  if (!state.unlocked) {
    throw new Error('桌面端保险库未解锁，请先完成本机配置并解锁')
  }
  return state
}

async function refreshMatchingCredentials(
  url?: string,
  force = false,
  matchBy: WebsiteMatchMode = 'host'
): Promise<MatchingCredentialsResult> {
  const state = await getDesktopState(force)
  const appearance = {
    desktopReady: state?.ready ?? false,
    themePreference: state?.themePreference ?? null,
    localePreference: state?.localePreference ?? null
  }
  if (!state?.unlocked) {
    clearCredentialsCache()
    return { credentials: [], needsSecurityKey: false, desktopUnlocked: false, ...appearance }
  }

  const keyword = url?.trim() ?? ''
  const cacheKey = `${matchBy}:${keyword || '__all__'}`
  const cached = credentialsCache.get(cacheKey)
  const now = Date.now()

  if (!force && cached && now - cached.timestamp < CACHE_TTL) {
    return { ...cached.result, ...appearance }
  }

  try {
    const result = url
      ? await getMatchingCredentialsApi(url, matchBy)
      : await getMatchingCredentialsApi('', matchBy)
    const merged: MatchingCredentialsResult = { ...result, desktopUnlocked: true, ...appearance }
    credentialsCache.set(cacheKey, { result: merged, timestamp: now })
    return merged
  } catch (err) {
    if (err instanceof Error && err.message.includes('桌面端')) {
      cachedHealth = null
    }
    throw err
  }
}

async function updateBadgeForTab(tabId: number, url?: string, force = false): Promise<void> {
  if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
    await chrome.action.setBadgeText({ tabId, text: '' })
    return
  }

  const state = await getDesktopState(force)
  if (!state?.unlocked) {
    await chrome.action.setBadgeText({ tabId, text: '' })
    return
  }

  try {
    const { credentials } = await refreshMatchingCredentials(url, force)
    const count = credentials.length
    await chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' })
    await chrome.action.setBadgeBackgroundColor({ tabId, color: '#5a7348' })
  } catch {
    await chrome.action.setBadgeText({ tabId, text: '' })
  }
}

async function resolveFillCredential(
  credentialId: string,
  pageUrl?: string
): Promise<FillCredential> {
  if (pageUrl) {
    const { credentials } = await refreshMatchingCredentials(pageUrl, false, 'host')
    const matched = credentials.find((item) => item.id === credentialId)
    if (matched) return matched
  }

  return getCredentialApi(credentialId)
}

async function handleAutofill(payload: AutofillPayload): Promise<void> {
  await assertDesktopUnlocked()

  const tabId = payload.tabId
  if (!tabId) throw new Error('无法定位当前标签页')

  const tab = await chrome.tabs.get(tabId)
  const pageUrl = tab.url ?? ''
  if (
    !pageUrl ||
    pageUrl.startsWith('chrome://') ||
    pageUrl.startsWith('edge://') ||
    pageUrl.startsWith('about:') ||
    pageUrl.startsWith('chrome-extension://')
  ) {
    throw new Error('当前页面不支持自动填充，请在网站登录页使用')
  }

  const credential = await resolveFillCredential(payload.credentialId, pageUrl)

  let filled = false
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'PERFORM_AUTOFILL',
      payload: credential
    })
    filled = !!response?.data
  } catch {
    filled = false
  }

  if (!filled) {
    throw new Error('当前页面未检测到登录表单，请确认已在登录页打开')
  }
}

async function handleCreateCredential(payload: UpsertCredentialPayload): Promise<void> {
  await assertDesktopUnlocked()
  await createCredentialApi(payload)
  clearCredentialsCache()
  await updateBadgeForActiveTab()
}

async function handleSaveCredential(payload: SaveCredentialPayload): Promise<void> {
  await handleCreateCredential({
    title: payload.title,
    username: payload.username,
    password: payload.password,
    websites: payload.website ? [payload.website] : []
  })
}

async function handleUpdateCredential(payload: UpdateCredentialPayload): Promise<void> {
  await assertDesktopUnlocked()
  await updateCredentialApi(payload)
  clearCredentialsCache()
  await updateBadgeForActiveTab()
}

async function updateBadgeForActiveTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tab?.id) {
    await updateBadgeForTab(tab.id, tab.url)
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'bear-autofill',
    title: '使用 BearPassword 填充',
    contexts: ['editable']
  })
  chrome.contextMenus.create({
    id: 'bear-generate',
    title: '生成强密码',
    contexts: ['editable']
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  if (info.menuItemId === 'bear-generate') {
    const password = generatePassword()
    await chrome.tabs.sendMessage(tab.id, {
      type: 'INSERT_TEXT',
      payload: password
    })
    return
  }

  if (info.menuItemId === 'bear-autofill' && tab.url) {
    try {
      const { credentials } = await refreshMatchingCredentials(tab.url)
      if (credentials.length === 1) {
        await handleAutofill({ tabId: tab.id, credentialId: credentials[0].id })
      } else if (credentials.length > 1) {
        await chrome.action.openPopup()
      }
    } catch {
      await chrome.action.openPopup()
    }
  }
})

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const tab = await chrome.tabs.get(tabId)
  await updateBadgeForTab(tabId, tab.url)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await updateBadgeForTab(tabId, tab.url, true)
    return
  }
  if (changeInfo.url) {
    await updateBadgeForTab(tabId, tab.url)
  }
})

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender)
    .then((data) => sendResponse({ data }))
    .catch((err: Error) => sendResponse({ error: err.message }))
  return true
})

async function handleMessage(message: ExtensionMessage, sender?: chrome.runtime.MessageSender): Promise<unknown> {
  switch (message.type) {
    case 'GET_DESKTOP_STATE':
      return getDesktopState(true)

    case 'REFRESH_DESKTOP_STATE': {
      cachedHealth = null
      clearCredentialsCache()
      const state = await getDesktopState(true)
      await updateBadgeForActiveTab()
      return state
    }

    case 'GET_MATCHING_CREDENTIALS': {
      const { url, matchBy = 'host', force = false } = message.payload as MatchingCredentialsPayload
      return refreshMatchingCredentials(url, force, matchBy)
    }

    case 'GET_ALL_LOGIN_CREDENTIALS': {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (activeTab?.url) {
        return refreshMatchingCredentials(activeTab.url, true)
      }
      return refreshMatchingCredentials(undefined, true)
    }

    case 'AUTOFILL':
      await handleAutofill(message.payload as AutofillPayload)
      return true

    case 'SAVE_CREDENTIAL':
      await handleSaveCredential(message.payload as SaveCredentialPayload)
      return true

    case 'CREATE_CREDENTIAL':
      await handleCreateCredential(message.payload as UpsertCredentialPayload)
      return true

    case 'UPDATE_CREDENTIAL':
      await handleUpdateCredential(message.payload as UpdateCredentialPayload)
      return true

    case 'TOGGLE_FAVORITE': {
      await assertDesktopUnlocked()
      const { credentialId, favorite } = message.payload as { credentialId: string; favorite: boolean }
      await toggleFavoriteApi(credentialId, favorite)
      clearCredentialsCache()
      return true
    }

    case 'DELETE_CREDENTIAL': {
      await assertDesktopUnlocked()
      const { credentialId } = message.payload as { credentialId: string }
      await deleteCredentialApi(credentialId)
      clearCredentialsCache()
      await updateBadgeForActiveTab()
      return true
    }

    case 'UPDATE_BADGE':
      await updateBadgeForActiveTab()
      return true

    case 'WAKE_DESKTOP':
      return wakeDesktopApi(sender?.tab?.id)

    case 'GENERATE_PASSWORD':
      return generatePassword(message.payload as Parameters<typeof generatePassword>[0])

    default:
      throw new Error(`未知消息类型: ${message.type}`)
  }
}
