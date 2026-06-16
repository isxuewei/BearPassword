import { logoutApi, getCurrentUserApi } from '@/shared/api/auth'
import { addFavoriteApi, getFavoriteIdsApi, removeFavoriteApi } from '@/shared/api/favorites'
import {
  createPasswordApi,
  deletePasswordApi,
  getPasswordDetailApi,
  getPasswordListApi,
  updatePasswordApi,
  validateVaultUnlockApi
} from '@/shared/api/vault'
import type {
  AutofillPayload,
  ExtensionMessage,
  ExtensionSession,
  FillCredential,
  LoginContent,
  MatchingCredentialsPayload,
  MatchingCredentialsResult,
  SaveCredentialPayload,
  UpdateCredentialPayload,
  UpsertCredentialPayload
} from '@/shared/types'
import { clearSession, loadSession, saveSession } from '@/shared/storage/session'
import type { WebsiteMatchMode } from '@/shared/types'
import { getUrlSearchKeyword } from '@/shared/utils/websiteMatch'
import {
  applyFavoriteState,
  buildLoginEntryParams,
  buildMatchingCredentialsResult,
  toFillCredential
} from '@/shared/utils/vaultTransform'
import { deriveVaultUnlockKey, toBase64 } from '@/shared/utils/contentCrypto'
import { getVaultUnlockFromSession } from '@/shared/utils/vaultUnlock'
import { generatePassword } from '@/shared/utils/passwordGenerator'

interface CredentialsCacheEntry {
  result: MatchingCredentialsResult
  timestamp: number
}

const credentialsCache = new Map<string, CredentialsCacheEntry>()
const CACHE_TTL = 60_000
const KEYWORD_PAGE_SIZE = 100

async function getActiveSession(): Promise<ExtensionSession | null> {
  const session = await loadSession()
  if (!session?.token) return null
  return session
}

function clearCredentialsCache(): void {
  credentialsCache.clear()
}

async function refreshMatchingCredentials(
  url?: string,
  force = false,
  matchBy: WebsiteMatchMode = 'host'
): Promise<MatchingCredentialsResult> {
  const session = await getActiveSession()
  if (!session) {
    clearCredentialsCache()
    return { credentials: [], needsSecurityKey: false }
  }

  const keyword = url ? getUrlSearchKeyword(url, matchBy) : ''
  const cacheKey = `${matchBy}:${keyword || '__all__'}`
  const cached = credentialsCache.get(cacheKey)
  const now = Date.now()

  if (!force && cached && now - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  const unlock = getVaultUnlockFromSession(session)
  const [page, favoriteIds] = await Promise.all([
    getPasswordListApi(session.serverOrigin, session.token, unlock, {
      page: 1,
      pageSize: keyword ? KEYWORD_PAGE_SIZE : 500,
      passwordType: '登录信息',
      keyword: keyword || undefined
    }),
    getFavoriteIdsApi(session.serverOrigin, session.token).catch(() => [] as number[])
  ])

  const result = url
    ? buildMatchingCredentialsResult(page.list, url, matchBy)
    : {
        credentials: page.list
          .map(toFillCredential)
          .filter((item): item is FillCredential => item !== null),
        needsSecurityKey: false
      }

  result.credentials = applyFavoriteState(result.credentials, favoriteIds)

  credentialsCache.set(cacheKey, { result, timestamp: now })
  return result
}

async function updateBadgeForTab(tabId: number, url?: string, force = false): Promise<void> {
  if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) {
    await chrome.action.setBadgeText({ tabId, text: '' })
    return
  }

  const session = await getActiveSession()
  if (!session) {
    await chrome.action.setBadgeText({ tabId, text: '' })
    return
  }

  const { credentials } = await refreshMatchingCredentials(url, force)
  const count = credentials.length
  await chrome.action.setBadgeText({ tabId, text: count > 0 ? String(count) : '' })
  await chrome.action.setBadgeBackgroundColor({ tabId, color: '#5a7348' })
}

async function resolveFillCredential(
  session: ExtensionSession,
  credentialId: number,
  pageUrl?: string
): Promise<FillCredential> {
  if (pageUrl) {
    const { credentials } = await refreshMatchingCredentials(pageUrl, false, 'host')
    const matched = credentials.find((item) => item.id === credentialId)
    if (matched) return matched
  }

  const unlock = getVaultUnlockFromSession(session)
  const entry = await getPasswordDetailApi(
    session.serverOrigin,
    session.token,
    unlock,
    credentialId
  )
  const credential = toFillCredential(entry)
  if (!credential) {
    throw new Error('无法读取该登录项，请先配置正确的安全密钥')
  }
  return credential
}

async function handleAutofill(payload: AutofillPayload): Promise<void> {
  const session = await getActiveSession()
  if (!session) throw new Error('请先登录')

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

  const credential = await resolveFillCredential(session, payload.credentialId, pageUrl)

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
  const session = await getActiveSession()
  if (!session) throw new Error('请先登录')

  const unlock = getVaultUnlockFromSession(session)
  const params = buildLoginEntryParams(
    payload.title,
    payload.username,
    payload.password,
    payload.websites
  )
  await createPasswordApi(session.serverOrigin, session.token, unlock, params)
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
  const session = await getActiveSession()
  if (!session) throw new Error('请先登录')

  const unlock = getVaultUnlockFromSession(session)
  const existing = await getPasswordDetailApi(
    session.serverOrigin,
    session.token,
    unlock,
    payload.credentialId
  )
  const content = existing.content as LoginContent
  const params = buildLoginEntryParams(
    payload.title,
    payload.username,
    payload.password,
    payload.websites,
    {
      extraFields: content.extraFields ?? [],
      remark: existing.remark ?? ''
    }
  )
  await updatePasswordApi(
    session.serverOrigin,
    session.token,
    unlock,
    payload.credentialId,
    params
  )
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
    const { credentials } = await refreshMatchingCredentials(tab.url)
    if (credentials.length === 1) {
      await handleAutofill({ tabId: tab.id, credentialId: credentials[0].id })
    } else if (credentials.length > 1) {
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

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  handleMessage(message)
    .then((data) => sendResponse({ data }))
    .catch((err: Error) => sendResponse({ error: err.message }))
  return true
})

async function handleMessage(message: ExtensionMessage): Promise<unknown> {
  switch (message.type) {
    case 'GET_SESSION':
      return loadSession()

    case 'SET_SESSION': {
      const session = message.payload as ExtensionSession
      await saveSession(session)
      clearCredentialsCache()
      await updateBadgeForActiveTab()
      return session
    }

    case 'SET_SECURITY_KEY': {
      const session = await loadSession()
      if (!session?.token) throw new Error('请先登录')
      const payload = message.payload as { securityKey: string; masterPassword: string }
      const securityKey = payload.securityKey.trim()
      const masterPassword = payload.masterPassword.trim()
      if (!securityKey) throw new Error('请输入安全密钥')
      if (!masterPassword) throw new Error('请输入主密码')

      const profile = await getCurrentUserApi(session.serverOrigin, session.token)
      if (!profile.vaultSalt) {
        throw new Error('服务端缺少保险库加密配置')
      }

      const vuk = await deriveVaultUnlockKey(masterPassword, securityKey, profile.vaultSalt)
      const unlock = { vuk }
      const validation = await validateVaultUnlockApi(
        session.serverOrigin,
        session.token,
        unlock
      )
      if (!validation.verified) {
        throw new Error(
          `密钥或主密码错误，无法解密已加密条目（共 ${validation.encryptedTotal} 条）。请确认与桌面端设置一致`
        )
      }

      const updated = { ...session, securityKey, vukBase64: toBase64(vuk) }
      await saveSession(updated)
      clearCredentialsCache()
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const { credentials } = activeTab?.url
        ? await refreshMatchingCredentials(activeTab.url, true)
        : await refreshMatchingCredentials(undefined, true)
      await updateBadgeForActiveTab()
      return {
        session: updated,
        usableCount: credentials.length,
        encryptedTotal: validation.encryptedTotal
      }
    }

    case 'CLEAR_SECURITY_KEY': {
      const session = await loadSession()
      if (!session?.token) return null
      const updated = { ...session, securityKey: null, vukBase64: null }
      await saveSession(updated)
      clearCredentialsCache()
      await updateBadgeForActiveTab()
      return updated
    }

    case 'LOGOUT': {
      const session = await loadSession()
      if (session?.token) {
        try {
          await logoutApi(session.serverOrigin, session.token)
        } catch {
          // 忽略登出失败
        }
      }
      await clearSession()
      clearCredentialsCache()
      await updateBadgeForActiveTab()
      return null
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
      const session = await getActiveSession()
      if (!session?.token) throw new Error('请先登录')
      const { credentialId, favorite } = message.payload as { credentialId: number; favorite: boolean }
      if (favorite) {
        await removeFavoriteApi(session.serverOrigin, session.token, credentialId)
      } else {
        await addFavoriteApi(session.serverOrigin, session.token, credentialId)
      }
      clearCredentialsCache()
      return true
    }

    case 'DELETE_CREDENTIAL': {
      const session = await getActiveSession()
      if (!session?.token) throw new Error('请先登录')
      const { credentialId } = message.payload as { credentialId: number }
      await deletePasswordApi(session.serverOrigin, session.token, credentialId)
      clearCredentialsCache()
      await updateBadgeForActiveTab()
      return true
    }

    case 'UPDATE_BADGE':
      await updateBadgeForActiveTab()
      return true

    case 'GENERATE_PASSWORD':
      return generatePassword(message.payload as Parameters<typeof generatePassword>[0])

    default:
      throw new Error(`未知消息类型: ${message.type}`)
  }
}
