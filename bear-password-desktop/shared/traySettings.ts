/** 状态栏图标点击行为 */
export type TrayClickAction = 'open' | 'quick-search'

/** 状态栏图标配置 */
export interface TraySettings {
  enabled: boolean
  clickAction: TrayClickAction
}

export const DEFAULT_TRAY_SETTINGS: TraySettings = {
  enabled: true,
  clickAction: 'open'
}

export const TRAY_CLICK_ACTIONS: TrayClickAction[] = ['open', 'quick-search']

export function normalizeTraySettings(raw: Partial<TraySettings> | null | undefined): TraySettings {
  const clickAction = raw?.clickAction
  return {
    enabled: raw?.enabled !== false,
    clickAction: TRAY_CLICK_ACTIONS.includes(clickAction as TrayClickAction)
      ? (clickAction as TrayClickAction)
      : DEFAULT_TRAY_SETTINGS.clickAction
  }
}
