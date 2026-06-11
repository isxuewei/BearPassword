import type { LoginParams, LoginResult, UserProfile } from '@/shared/types'
import { http } from '@/shared/utils/request'

export function loginApi(origin: string, params: LoginParams): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', params, { origin })
}

export function logoutApi(origin: string, token: string): Promise<void> {
  return http.post<void>('/auth/logout', {}, { origin, token })
}

export function getCurrentUserApi(origin: string, token: string): Promise<UserProfile> {
  return http.get<UserProfile>('/auth/me', { origin, token })
}
