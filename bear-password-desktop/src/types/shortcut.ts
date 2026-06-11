/** 快捷键动作 ID */
export type ShortcutActionId = 'open' | 'lock'

/** 快捷键配置 */
export interface ShortcutSettings {
  open: string | null
  lock: string | null
}

export const DEFAULT_SHORTCUT_SETTINGS: ShortcutSettings = {
  open: 'Alt+B',
  lock: 'Alt+L'
}

/** 设置页展示项 */
export const SHORTCUT_ACTION_OPTIONS: {
  id: ShortcutActionId
  label: string
  description: string
}[] = [
  {
    id: 'open',
    label: '打开 BearPassword',
    description: '全局唤起并聚焦应用窗口'
  },
  {
    id: 'lock',
    label: '锁定 BearPassword',
    description: '立即锁定应用，需输入密码解锁'
  }
]

export type ShortcutSyncResult = {
  ok: boolean
  failed?: Partial<Record<ShortcutActionId, string>>
  status?: ShortcutRegistrationStatus
}

export type ShortcutRegistrationStatus = {
  open: { enabled: boolean; registered: boolean }
  lock: { enabled: boolean; registered: boolean }
}
