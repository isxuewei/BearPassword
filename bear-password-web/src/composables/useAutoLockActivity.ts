import { onMounted, onUnmounted, watch } from 'vue'
import { useAutoLockStore } from '@/stores/autoLock'
import { useSecurityStore } from '@/stores/security'

/** 视为「有操作」的事件（不含 mousemove，避免指针微动导致永不锁定） */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

/**
 * 绑定全局用户活动监听，供自动锁定使用
 */
export function useAutoLockActivity(): void {
  const autoLockStore = useAutoLockStore()
  const securityStore = useSecurityStore()

  function handleActivity(): void {
    if (securityStore.isMigrating) return
    autoLockStore.touchActivity()
  }

  function bindActivityListeners(): void {
    ACTIVITY_EVENTS.forEach((eventName) => {
      document.addEventListener(eventName, handleActivity, { capture: true, passive: true })
    })
    document.addEventListener('scroll', handleActivity, { capture: true, passive: true })
  }

  function unbindActivityListeners(): void {
    ACTIVITY_EVENTS.forEach((eventName) => {
      document.removeEventListener(eventName, handleActivity, true)
    })
    document.removeEventListener('scroll', handleActivity, true)
  }

  onMounted(() => {
    autoLockStore.start()
    bindActivityListeners()
  })

  onUnmounted(() => {
    autoLockStore.pauseMonitoring()
    unbindActivityListeners()
  })

  watch(
    () => securityStore.isMigrating,
    (migrating) => {
      if (migrating) {
        autoLockStore.pauseMonitoring()
        return
      }
      autoLockStore.start()
    }
  )
}
