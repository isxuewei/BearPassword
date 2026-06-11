import { http } from '@/shared/utils/request'

export interface HealthInfo {
  status: string
}

/** 健康检查（无需登录） */
export function getHealthApi(origin: string): Promise<HealthInfo> {
  return http.get<HealthInfo>('/health', { origin })
}
