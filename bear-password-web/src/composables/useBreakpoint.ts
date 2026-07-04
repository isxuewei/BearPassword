import { onMounted, onUnmounted, ref } from 'vue'

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useBreakpoint() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(true)

  function update(): void {
    const width = window.innerWidth
    isMobile.value = width < MOBILE_BREAKPOINT
    isTablet.value = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
    isDesktop.value = width >= TABLET_BREAKPOINT
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { isMobile, isTablet, isDesktop }
}
