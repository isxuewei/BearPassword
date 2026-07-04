import { request } from '@/utils/request'
import type { DashboardStats } from '@/types'
import {
  fetchOfflinePasswordEntriesRaw,
  getOfflineFavoriteMetaApi,
  getOfflineRecentVisitMetaApi,
  shouldUseOfflineVault
} from '@/api/offlineVaultLocal'

/** 仪表盘统计 */
export async function getDashboardStatsApi(): Promise<DashboardStats> {
  if (shouldUseOfflineVault()) {
    const [entries, favorites, recents] = await Promise.all([
      fetchOfflinePasswordEntriesRaw(),
      getOfflineFavoriteMetaApi(),
      getOfflineRecentVisitMetaApi()
    ])

    return {
      totalPasswords: entries.length,
      favoriteCount: favorites.length,
      recentCount: recents.length
    }
  }

  return request.get<DashboardStats>('/dashboard/stats')
}
