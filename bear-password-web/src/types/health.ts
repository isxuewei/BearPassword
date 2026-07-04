/** 后端健康检查响应 */
export interface HealthInfo {
  status: string
  service: string
  datasource?: string
  poolActive?: number
  poolIdle?: number
  poolMaxActive?: number
}
