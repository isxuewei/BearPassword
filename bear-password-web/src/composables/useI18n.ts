import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { t as translate } from '@/locales'

/** 响应式国际化 composable */
export function useI18n() {
  const appStore = useAppStore()

  const locale = computed(() => appStore.resolvedLocale)

  function t(key: string, params?: Record<string, string | number>): string {
    return translate(key, locale.value, params)
  }

  return { t, locale }
}
