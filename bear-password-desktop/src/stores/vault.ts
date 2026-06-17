import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchAllPasswordEntries } from '@/api/vault'
import { getFavoriteMetaApi } from '@/api/favorites'
import { getRecentVisitMetaApi } from '@/api/recent'
import type { PasswordEntry } from '@/types'
import type { FavoriteMetaItem, RecentVisitMetaItem } from '@/utils/vaultEntryLists'
import {
  buildFavoriteEntries,
  buildRecentEntries,
  mapFavoriteMeta,
  mapRecentVisitMeta
} from '@/utils/vaultEntryLists'
import { isOfflineVaultMode } from '@/utils/offlineVaultMode'

/** 后台定时刷新间隔（毫秒） */
const BACKGROUND_REFRESH_MS = 5 * 60 * 1000

interface RefreshOptions {
  /** 已有缓存时静默刷新，不展示全屏加载 */
  background?: boolean
}

/**
 * 密码库全量缓存：从服务器拉取密文后本地解密，收藏/最近访问由缓存 + 元数据组装
 */
export const useVaultStore = defineStore('vault', () => {
  const allEntries = ref<PasswordEntry[]>([])
  const favoriteMeta = ref<FavoriteMetaItem[]>([])
  const recentMeta = ref<RecentVisitMetaItem[]>([])
  const initialLoading = ref(false)
  const backgroundRefreshing = ref(false)
  const loaded = ref(false)

  let refreshPromise: Promise<void> | null = null
  let backgroundTimer: ReturnType<typeof setInterval> | null = null

  const favoriteIds = computed(() => favoriteMeta.value.map((item) => item.passwordId))

  const favoriteEntries = computed(() => buildFavoriteEntries(allEntries.value, favoriteMeta.value))

  const recentEntries = computed(() => buildRecentEntries(allEntries.value, recentMeta.value))

  /** 仅首次加载时展示列表 loading */
  const loading = computed(() => initialLoading.value)

  function startBackgroundTimer(): void {
    if (isOfflineVaultMode()) {
      stopBackgroundTimer()
      return
    }
    stopBackgroundTimer()
    backgroundTimer = setInterval(() => {
      if (loaded.value) {
        void refresh({ background: true })
      }
    }, BACKGROUND_REFRESH_MS)
  }

  function stopBackgroundTimer(): void {
    if (backgroundTimer) {
      clearInterval(backgroundTimer)
      backgroundTimer = null
    }
  }

  async function fetchAndApply(): Promise<void> {
    const [entries, favorites, recents] = await Promise.all([
      fetchAllPasswordEntries(),
      getFavoriteMetaApi(),
      getRecentVisitMetaApi()
    ])
    allEntries.value = entries
    favoriteMeta.value = mapFavoriteMeta(favorites)
    recentMeta.value = mapRecentVisitMeta(recents)
    loaded.value = true
  }

  async function refresh(options: RefreshOptions = {}): Promise<void> {
    if (refreshPromise) return refreshPromise

    const background = options.background === true && loaded.value

    refreshPromise = (async () => {
      if (background) {
        backgroundRefreshing.value = true
      } else {
        initialLoading.value = true
      }

      try {
        await fetchAndApply()
        startBackgroundTimer()
      } finally {
        initialLoading.value = false
        backgroundRefreshing.value = false
        refreshPromise = null
      }
    })()

    return refreshPromise
  }

  /** 进入密码库：有缓存则立即展示，并后台静默同步 */
  async function ensureLoaded(): Promise<void> {
    if (loaded.value) {
      void refresh({ background: true })
      return
    }
    await refresh()
  }

  /** 条目新增/修改/删除/导入后强制同步 */
  async function refreshAfterMutation(): Promise<void> {
    await refresh({ background: loaded.value })
  }

  /** 仅刷新收藏与最近访问元数据（不涉及密码条目 content） */
  async function refreshMeta(): Promise<void> {
    try {
      const [favorites, recents] = await Promise.all([
        getFavoriteMetaApi(),
        getRecentVisitMetaApi()
      ])
      favoriteMeta.value = mapFavoriteMeta(favorites)
      recentMeta.value = mapRecentVisitMeta(recents)
    } catch {
      // 保留现有元数据
    }
  }

  function reset(): void {
    stopBackgroundTimer()
    allEntries.value = []
    favoriteMeta.value = []
    recentMeta.value = []
    loaded.value = false
    initialLoading.value = false
    backgroundRefreshing.value = false
    refreshPromise = null
  }

  function setFavoriteIds(ids: number[]): void {
    const timeById = new Map(favoriteMeta.value.map((item) => [item.passwordId, item.favoriteTime]))
    favoriteMeta.value = ids.map((id) => ({
      passwordId: Number(id),
      favoriteTime: timeById.get(Number(id)) ?? new Date().toISOString()
    }))
  }

  return {
    allEntries,
    favoriteMeta,
    recentMeta,
    favoriteEntries,
    recentEntries,
    favoriteIds,
    loading,
    initialLoading,
    backgroundRefreshing,
    loaded,
    refresh,
    ensureLoaded,
    refreshAfterMutation,
    refreshMeta,
    reset,
    setFavoriteIds
  }
})
