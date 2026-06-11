/** 状态栏图标点击行为选项（设置页展示） */
export const TRAY_CLICK_ACTION_OPTIONS = [
  {
    value: 'open' as const,
    label: '打开 BearPassword',
    description: '显示并聚焦主窗口'
  },
  {
    value: 'quick-search' as const,
    label: '打开快捷搜索',
    description: '打开密码库并聚焦搜索框'
  }
]

export type { TrayClickAction, TraySettings } from '../../shared/traySettings'
