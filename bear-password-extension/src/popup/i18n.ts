import { t as translate } from '@/locales'
import { useLocaleStore } from '@/popup/stores/locale'

/** 在 store 等非组件上下文中使用 */
export function t(key: string, params?: Record<string, string | number>): string {
  const localeStore = useLocaleStore()
  return translate(key, localeStore.resolvedLocale, params)
}
