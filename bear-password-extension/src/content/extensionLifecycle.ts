import { hideInlinePicker } from '@/content/inlinePicker'
import { removeSaveBanner } from '@/content/inpageBanner'
import { isExtensionContextValid } from '@/shared/utils/extensionContext'

const teardownCallbacks: Array<() => void> = []
let contextWatchTimer: ReturnType<typeof setInterval> | null = null
let tornDown = false

export function onExtensionTeardown(callback: () => void): void {
  teardownCallbacks.push(callback)
}

export function runExtensionTeardown(): void {
  if (tornDown) return
  tornDown = true

  if (contextWatchTimer) {
    clearInterval(contextWatchTimer)
    contextWatchTimer = null
  }

  hideInlinePicker()
  removeSaveBanner()
  teardownCallbacks.splice(0).forEach((callback) => callback())
}

export function startExtensionContextWatch(): void {
  if (contextWatchTimer) return

  contextWatchTimer = setInterval(() => {
    if (!isExtensionContextValid()) {
      runExtensionTeardown()
    }
  }, 2000)
}
