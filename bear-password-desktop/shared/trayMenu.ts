/** 托盘右键菜单可切换的主题值 */
export const TRAY_THEME_VALUES = [
  'light',
  'ocean',
  'warm',
  'bloom',
  'rose',
  'mint',
  'lagoon',
  'forest',
  'violet',
  'earth',
  'dark',
  'midnight',
  'noir',
  'system'
] as const

export type TrayThemeValue = (typeof TRAY_THEME_VALUES)[number]

/** 托盘右键菜单可切换的语言值 */
export const TRAY_LOCALE_VALUES = ['system', 'zh-CN', 'en', 'ja'] as const

export type TrayLocaleValue = (typeof TRAY_LOCALE_VALUES)[number]

/** 托盘右键菜单可切换的字体值 */
export const TRAY_FONT_VALUES = ['canger', 'system'] as const

export type TrayFontValue = (typeof TRAY_FONT_VALUES)[number]

export interface TrayMenuLabels {
  open: string
  lock: string
  settings: string
  theme: string
  language: string
  font: string
  quit: string
  themes: Partial<Record<TrayThemeValue, string>>
  locales: Partial<Record<TrayLocaleValue, string>>
  fonts: Partial<Record<TrayFontValue, string>>
}

export interface TrayAppearanceSnapshot {
  theme: string
  locale: string
  font: string
  labels: TrayMenuLabels
}

export type TrayRendererCommand =
  | { action: 'open' }
  | { action: 'lock' }
  | { action: 'settings' }
  | { action: 'quick-search' }
  | { action: 'set-theme'; value: TrayThemeValue }
  | { action: 'set-locale'; value: TrayLocaleValue }
  | { action: 'set-font'; value: TrayFontValue }

/** 主进程菜单文案回退（未同步渲染进程标签时使用） */
export const DEFAULT_TRAY_MENU_LABELS: TrayMenuLabels = {
  open: '打开 BearPassword',
  lock: '锁定 BearPassword',
  settings: '设置 BearPassword',
  theme: '主题',
  language: '语言',
  font: '字体',
  quit: '退出',
  themes: {
    light: '浅色',
    ocean: '清新',
    warm: '暖阳',
    bloom: '缤粉',
    rose: '樱粉',
    mint: '薄荷',
    lagoon: '碧波',
    forest: '森绿',
    violet: '紫韵',
    earth: '大地',
    dark: '深色',
    midnight: '午夜',
    noir: '檀夜',
    system: '跟随系统'
  },
  locales: {
    system: '跟随系统',
    'zh-CN': '中文',
    en: 'English',
    ja: '日本語'
  },
  fonts: {
    canger: '仓耳今楷',
    system: '跟随系统'
  }
}
