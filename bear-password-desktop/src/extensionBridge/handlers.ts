import { addFavoriteApi, getFavoriteIdsApi, removeFavoriteApi } from '@/api/favorites'
import {
  createPasswordApi,
  deletePasswordApi,
  getPasswordDetailApi,
  updatePasswordApi
} from '@/api/vault'
import type { LoginContent, PasswordEntry, PasswordEntryParams } from '@/types'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'
import { useVaultStore } from '@/stores/vault'
import type { ExtensionBridgeHealth } from '../../shared/extensionBridge'
import {
  applyFavoriteState,
  buildMatchingCredentialsResult,
  toFillCredential,
  type FillCredential
} from '@/extensionBridge/transform'
import { resolveEntryType } from '@/utils/vaultEntryDisplay'

function assertVaultReady(): void {
  const authStore = useAuthStore()
  const securityStore = useSecurityStore()
  const autoLockStore = useAutoLockStore()

  if (!authStore.isLoggedIn) {
    throw new Error('请先在桌面端登录')
  }
  if (autoLockStore.isLocked) {
    throw new Error('桌面端已锁定，请先解锁保险库')
  }
  if (!securityStore.hasVaultAccess) {
    throw new Error('桌面端保险库未解锁，请先完成本机配置并解锁')
  }
}

export function extensionBridgeHealth(): ExtensionBridgeHealth {
  const authStore = useAuthStore()
  const securityStore = useSecurityStore()
  const autoLockStore = useAutoLockStore()
  const appStore = useAppStore()

  return {
    ready: true,
    loggedIn: authStore.isLoggedIn,
    locked: autoLockStore.isLocked,
    unlocked: authStore.isLoggedIn && !autoLockStore.isLocked && securityStore.hasVaultAccess,
    username: authStore.isLoggedIn ? authStore.username : null,
    themePreference: appStore.themePreference,
    localePreference: appStore.localePreference
  }
}

async function getLoginEntriesForMatch(): Promise<PasswordEntry[]> {
  const vaultStore = useVaultStore()
  await vaultStore.ensureLoaded()
  return vaultStore.allEntries.filter((entry) => resolveEntryType(entry) === '登录信息')
}

export async function extensionBridgeMatchCredentials(params: {
  url?: string
  matchBy?: 'host' | 'path'
}): Promise<{ credentials: FillCredential[]; needsSecurityKey: boolean }> {
  assertVaultReady()

  const url = params.url?.trim() ?? ''
  const matchBy = params.matchBy ?? 'host'

  const [entries, favoriteIds] = await Promise.all([
    getLoginEntriesForMatch(),
    getFavoriteIdsApi().catch(() => [] as number[])
  ])

  const result = url
    ? buildMatchingCredentialsResult(entries, url, matchBy)
    : {
        credentials: entries
          .map(toFillCredential)
          .filter((item): item is FillCredential => item !== null),
        needsSecurityKey: false
      }

  return {
    credentials: applyFavoriteState(result.credentials, favoriteIds),
    needsSecurityKey: result.needsSecurityKey
  }
}

export async function extensionBridgeGetCredential(params: { id: number }): Promise<FillCredential> {
  assertVaultReady()
  const entry = await getPasswordDetailApi(params.id)
  const credential = toFillCredential(entry)
  if (!credential) {
    throw new Error('无法读取该登录项')
  }
  return credential
}

function buildLoginEntryParams(
  title: string,
  username: string,
  password: string,
  websites: string[],
  options?: { extraFields?: LoginContent['extraFields']; remark?: string }
): PasswordEntryParams {
  const normalizedWebsites = websites.map((url) => url.trim()).filter(Boolean)
  const content: LoginContent = {
    title,
    username,
    password,
    websites: normalizedWebsites,
    host: '',
    extraFields: options?.extraFields ?? []
  }
  return {
    passwordType: '登录信息',
    passwordLabels: [],
    passwordTitle: title,
    content,
    websites: normalizedWebsites,
    remark: options?.remark ?? ''
  }
}

export async function extensionBridgeCreateCredential(params: {
  title: string
  username: string
  password: string
  websites: string[]
}): Promise<void> {
  assertVaultReady()
  await createPasswordApi(
    buildLoginEntryParams(params.title, params.username, params.password, params.websites)
  )
  await useVaultStore().refreshAfterMutation()
}

export async function extensionBridgeUpdateCredential(params: {
  credentialId: number
  title: string
  username: string
  password: string
  websites: string[]
}): Promise<void> {
  assertVaultReady()
  const existing = await getPasswordDetailApi(params.credentialId)
  const content = existing.content as LoginContent
  await updatePasswordApi(
    params.credentialId,
    buildLoginEntryParams(params.title, params.username, params.password, params.websites, {
      extraFields: content.extraFields ?? [],
      remark: existing.remark ?? ''
    })
  )
  await useVaultStore().refreshAfterMutation()
}

export async function extensionBridgeDeleteCredential(params: { id: number }): Promise<void> {
  assertVaultReady()
  await deletePasswordApi(params.id)
  await useVaultStore().refreshAfterMutation()
}

export async function extensionBridgeToggleFavorite(params: {
  credentialId: number
  favorite: boolean
}): Promise<void> {
  assertVaultReady()
  if (params.favorite) {
    await removeFavoriteApi(params.credentialId)
  } else {
    await addFavoriteApi(params.credentialId)
  }
}

export type ExtensionBridgeHandler = (params: unknown) => Promise<unknown> | unknown

export const extensionBridgeHandlers: Record<string, ExtensionBridgeHandler> = {
  health: () => extensionBridgeHealth(),
  matchCredentials: (params) => extensionBridgeMatchCredentials(params as { url?: string; matchBy?: 'host' | 'path' }),
  getCredential: (params) => extensionBridgeGetCredential(params as { id: number }),
  createCredential: (params) =>
    extensionBridgeCreateCredential(
      params as { title: string; username: string; password: string; websites: string[] }
    ),
  updateCredential: (params) =>
    extensionBridgeUpdateCredential(
      params as {
        credentialId: number
        title: string
        username: string
        password: string
        websites: string[]
      }
    ),
  deleteCredential: (params) => extensionBridgeDeleteCredential(params as { id: number }),
  toggleFavorite: (params) =>
    extensionBridgeToggleFavorite(params as { credentialId: number; favorite: boolean })
}
