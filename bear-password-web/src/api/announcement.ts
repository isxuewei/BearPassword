import { request } from '@/utils/request'
import type { Announcement } from '@/types/announcement'

/** 获取当前用户待确认的最新公告 */
export function getPendingAnnouncementApi(): Promise<Announcement | null> {
  return request.get<Announcement | null>('/announcements/pending')
}

/** 确认公告 */
export function confirmAnnouncementApi(id: number): Promise<void> {
  return request.post<void>(`/announcements/${id}/confirm`)
}
