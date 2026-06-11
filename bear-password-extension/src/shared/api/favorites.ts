import { http } from '@/shared/utils/request'

export function getFavoriteIdsApi(origin: string, token: string): Promise<number[]> {
  return http.get<number[]>('/favorites/ids', { origin, token })
}

export function addFavoriteApi(origin: string, token: string, passwordId: number): Promise<void> {
  return http.post<void>(`/favorites/${passwordId}`, {}, { origin, token })
}

export function removeFavoriteApi(origin: string, token: string, passwordId: number): Promise<void> {
  return http.delete<void>(`/favorites/${passwordId}`, { origin, token })
}
