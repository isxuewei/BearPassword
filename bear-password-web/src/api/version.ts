import { request } from '@/utils/request'
import type { AppVersionLatest } from '@/types/version'

/** 查询指定系统的最新版本 */
export function getLatestVersionApi(system: string): Promise<AppVersionLatest | null> {
  return request.get<AppVersionLatest | null>('/version/latest', { params: { system } })
}
