/**
 * Dashboard 仪表盘相关类型定义
 */

/** 仪表盘统计数据 */
export interface DashboardStats {
  /** 密码库总条目数 */
  totalPasswords: number
  /** 收藏密码数 */
  favoriteCount: number
  /** 最近访问数量 */
  recentCount: number
}
