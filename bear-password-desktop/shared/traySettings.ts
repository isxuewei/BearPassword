/** 状态栏图标点击行为 */
export type TrayClickAction = 'vault' | 'favorites' | 'recent' | 'settings'

/** 状态栏图标配置 */
export interface TraySettings {
  enabled: boolean
  clickAction: TrayClickAction
}

export const DEFAULT_TRAY_SETTINGS: TraySettings = {
  enabled: true,
  clickAction: 'vault'
}

export const TRAY_CLICK_ACTIONS: TrayClickAction[] = ['vault', 'favorites', 'recent', 'settings']

const LEGACY_TRAY_CLICK_ACTIONS: Record<string, TrayClickAction> = {
  open: 'vault',
  'quick-search': 'vault'
}

export function normalizeTrayClickAction(raw: unknown): TrayClickAction {
  if (typeof raw === 'string' && LEGACY_TRAY_CLICK_ACTIONS[raw]) {
    return LEGACY_TRAY_CLICK_ACTIONS[raw]
  }
  if (TRAY_CLICK_ACTIONS.includes(raw as TrayClickAction)) {
    return raw as TrayClickAction
  }
  return DEFAULT_TRAY_SETTINGS.clickAction
}

export function normalizeTraySettings(raw: Partial<TraySettings> | null | undefined): TraySettings {
  return {
    enabled: raw?.enabled !== false,
    clickAction: normalizeTrayClickAction(raw?.clickAction)
  }
}
