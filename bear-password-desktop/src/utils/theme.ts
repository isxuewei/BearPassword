import { storage } from './storage'
import { ref } from 'vue'

/** 系统深浅色变化计数，供 computed 追踪（cache 本身非响应式） */
export const systemThemeRevision = ref(0)

/**
 * 主题工具
 * 解析用户偏好并应用到 DOM
 * 新增主题：在 THEME_PRESET_OPTIONS 增加一项，并添加对应 styles/themes/_*.scss
 */

/** 预设主题 ID */
export type ThemePresetId = 'light' | 'ocean' | 'warm' | 'bloom' | 'rose' | 'mint' | 'lagoon' | 'forest' | 'violet' | 'earth' | 'dark' | 'midnight' | 'noir'

/** 用户可选择的主题偏好（含跟随系统） */
export type ThemePreference = ThemePresetId | 'system'

/** 实际生效的主题 */
export type ResolvedTheme = ThemePresetId

/** 可选主题项（设置页下拉） */
export interface ThemeOption {
  value: ThemePreference
  label: string
  description: string
}

/** 预设主题（不含「跟随系统」） */
export const THEME_PRESET_OPTIONS: readonly ThemeOption[] = [
  { value: 'light', label: '浅色', description: '经典浅色界面' },
  { value: 'ocean', label: '清新', description: '浅蓝柔和风格' },
  { value: 'warm', label: '暖阳', description: '米色暖橙风格' },
  { value: 'bloom', label: '缤粉', description: '粉青活力风格' },
  { value: 'rose', label: '樱粉', description: '粉紫温柔风格' },
  { value: 'mint', label: '薄荷', description: '青绿自然风格' },
  { value: 'lagoon', label: '碧波', description: '深青薄荷风格' },
  { value: 'forest', label: '森绿', description: '墨绿森系风格' },
  { value: 'violet', label: '紫韵', description: '紫色典雅风格' },
  { value: 'earth', label: '大地', description: '橄榄暖调风格' },
  { value: 'dark', label: '深色', description: '深灰紫护眼模式' },
  { value: 'midnight', label: '午夜', description: '深海军蓝风格' },
  { value: 'noir', label: '檀夜', description: '深蓝暖棕典雅风格' }
]

/** 设置页下拉完整列表 */
export const THEME_OPTIONS: ThemeOption[] = [
  ...THEME_PRESET_OPTIONS,
  { value: 'system', label: '跟随系统', description: '' }
]

const VALID_THEME_PREFERENCES = new Set<string>(THEME_OPTIONS.map((item) => item.value))

/** 校验并规范化存储的主题偏好 */
export function normalizeThemePreference(value: unknown): ThemePreference {
  if (typeof value === 'string' && VALID_THEME_PREFERENCES.has(value)) {
    return value as ThemePreference
  }
  return 'light'
}

/** 系统浅色 / 深色对应的预设主题 */
export const SYSTEM_LIGHT_THEME: ThemePresetId = 'light'
export const SYSTEM_DARK_THEME: ThemePresetId = 'dark'

type SystemThemeListener = () => void

let systemThemeDarkCache: boolean | null = null
let systemThemeListeners: SystemThemeListener[] = []
let systemThemeUnsubscribe: (() => void) | null = null

function setSystemThemeCache(dark: boolean): void {
  if (systemThemeDarkCache === dark) return
  systemThemeDarkCache = dark
  systemThemeRevision.value += 1
}

function notifySystemThemeChange(): void {
  systemThemeListeners.forEach((listener) => listener())
}

/** 读取系统深浅色偏好（Electron 优先使用 nativeTheme） */
export function getSystemTheme(): 'light' | 'dark' {
  if (systemThemeDarkCache !== null) {
    return systemThemeDarkCache ? 'dark' : 'light'
  }
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** 监听系统外观变化，返回取消订阅函数 */
export function subscribeSystemThemeChange(listener: SystemThemeListener): () => void {
  systemThemeListeners.push(listener)
  void ensureSystemThemeWatching()
  return () => {
    systemThemeListeners = systemThemeListeners.filter((item) => item !== listener)
  }
}

/** 从 Electron nativeTheme 同步系统深浅色（启动时调用） */
export async function syncSystemThemeFromPlatform(): Promise<void> {
  if (typeof window === 'undefined' || !window.themeApi) return
  try {
    setSystemThemeCache(await window.themeApi.getShouldUseDarkColors())
  } catch {
    // 回退到 matchMedia
  }
}

async function ensureSystemThemeWatching(): Promise<void> {
  if (systemThemeUnsubscribe || typeof window === 'undefined') return

  const onSystemThemeChanged = (): void => notifySystemThemeChange()

  if (window.themeApi) {
    try {
      setSystemThemeCache(await window.themeApi.getShouldUseDarkColors())
    } catch {
      // 回退到 CSS 媒体查询
    }
    const removeIpcListener = window.themeApi.onUpdated((dark) => {
      setSystemThemeCache(dark)
      onSystemThemeChanged()
    })

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const mediaHandler = (): void => {
      setSystemThemeCache(media.matches)
      onSystemThemeChanged()
    }
    media.addEventListener('change', mediaHandler)

    systemThemeUnsubscribe = () => {
      removeIpcListener()
      media.removeEventListener('change', mediaHandler)
    }
    return
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = (): void => {
    setSystemThemeCache(media.matches)
    onSystemThemeChanged()
  }
  media.addEventListener('change', handler)
  systemThemeUnsubscribe = () => media.removeEventListener('change', handler)
}

/** 根据偏好解析最终主题 */
export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme() === 'dark' ? SYSTEM_DARK_THEME : SYSTEM_LIGHT_THEME
  }
  return preference
}

/** 主题偏好显示名称 */
export function getThemePreferenceLabel(preference: ThemePreference): string {
  if (preference === 'system') return '跟随系统'
  return THEME_PRESET_OPTIONS.find((item) => item.value === preference)?.label ?? '浅色'
}

/** 主题偏好说明（设置页副标题） */
export function getThemePreferenceDescription(preference: ThemePreference): string {
  if (preference === 'system') {
    return '随系统外观在浅色与深色间自动切换'
  }
  return THEME_PRESET_OPTIONS.find((item) => item.value === preference)?.description ?? ''
}

/** 下拉选项展示文案 */
export function getThemeOptionLabel(option: ThemeOption): string {
  return option.label
}

/** 是否为深色类主题（需启用 Element Plus dark 模式） */
function isDarkResolvedTheme(theme: ResolvedTheme): boolean {
  return theme === 'dark' || theme === 'midnight' || theme === 'noir'
}

/** 将主题应用到 document（含 Element Plus 深色 class） */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.toggle('dark', isDarkResolvedTheme(theme))
}

/** 应用启动时尽早初始化，减少主题闪烁 */
export function initThemeOnBoot(): void {
  const preference = normalizeThemePreference(storage.get('theme', 'light'))
  applyResolvedTheme(resolveTheme(preference))
}
