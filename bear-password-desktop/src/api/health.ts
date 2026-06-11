import { request } from '@/utils/request'
import type { HealthInfo } from '@/types/health'

/** 健康检查（无需登录） */
export function getHealthApi(): Promise<HealthInfo> {
  return request.get<HealthInfo>('/health', { timeout: 8000 })
}
