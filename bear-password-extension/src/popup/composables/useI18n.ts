import { computed } from 'vue'
import { t as translate } from '@/locales'
import { useLocaleStore } from '@/popup/stores/locale'

/** 响应式国际化 composable */
export function useI18n() {
  const localeStore = useLocaleStore()

  const locale = computed(() => localeStore.resolvedLocale)

  function t(key: string, params?: Record<string, string | number>): string {
    return translate(key, localeStore.resolvedLocale, params)
  }

  return { t, locale }
}
