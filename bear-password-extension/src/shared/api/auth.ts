import type { UserProfile } from '@/shared/types'
import { http } from '@/shared/utils/request'

export { loginApi } from '@/shared/api/srpAuth'

export function logoutApi(origin: string, token: string): Promise<void> {
  return http.post<void>('/auth/logout', {}, { origin, token })
}

export function getCurrentUserApi(origin: string, token: string): Promise<UserProfile> {
  return http.get<UserProfile>('/auth/me', { origin, token })
}
