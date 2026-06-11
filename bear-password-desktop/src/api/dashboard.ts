import { request } from '@/utils/request'
import type { DashboardStats } from '@/types'

/** 仪表盘统计 */
export function getDashboardStatsApi(): Promise<DashboardStats> {
  return request.get<DashboardStats>('/dashboard/stats')
}
