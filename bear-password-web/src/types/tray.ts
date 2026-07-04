/** 状态栏图标点击行为选项（设置页展示） */
export const TRAY_CLICK_ACTION_OPTIONS = [
  { value: 'vault' as const },
  { value: 'favorites' as const },
  { value: 'recent' as const },
  { value: 'settings' as const }
]

export type { TrayClickAction, TraySettings } from '../../shared/traySettings'
