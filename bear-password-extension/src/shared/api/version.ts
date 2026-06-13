import { http } from '@/shared/utils/request'

/** 服务端最新版本信息 */
export interface AppVersionLatest {
  system: string
  versionCode: string
  downloadUrl: string
  createTime?: string
}

/** 查询指定系统的最新版本（无需登录） */
export function getLatestVersionApi(origin: string, system: string): Promise<AppVersionLatest | null> {
  return http.get<AppVersionLatest | null>('/version/latest', {
    origin,
    params: { system }
  })
}
