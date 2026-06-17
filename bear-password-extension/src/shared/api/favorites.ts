import { http } from '@/shared/utils/request'

export function getFavoriteIdsApi(origin: string, token: string): Promise<string[]> {
  return http.get<string[]>('/favorites/ids', { origin, token })
}

export function addFavoriteApi(origin: string, token: string, passwordId: string): Promise<void> {
  return http.post<void>(`/favorites/${passwordId}`, {}, { origin, token })
}

export function removeFavoriteApi(origin: string, token: string, passwordId: string): Promise<void> {
  return http.delete<void>(`/favorites/${passwordId}`, { origin, token })
}
