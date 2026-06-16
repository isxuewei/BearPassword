import { useClipboardClearStore } from '@/stores/clipboardClear'

let clearTimer: ReturnType<typeof setTimeout> | null = null
let lastCopiedText: string | null = null

function cancelScheduledClear(): void {
  if (clearTimer) {
    clearTimeout(clearTimer)
    clearTimer = null
  }
}

function copyViaExecCommand(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
}

function scheduleClear(copiedText: string): void {
  cancelScheduledClear()

  const clearSeconds = useClipboardClearStore().clearSeconds
  if (clearSeconds <= 0) {
    lastCopiedText = null
    return
  }

  lastCopiedText = copiedText
  clearTimer = setTimeout(() => {
    clearTimer = null
    void clearIfStillOwned(false)
  }, clearSeconds * 1000)
}

async function clearIfStillOwned(force = false): Promise<void> {
  if (!lastCopiedText) return

  const expected = lastCopiedText
  lastCopiedText = null

  try {
    if (!navigator.clipboard?.writeText) return

    if (!force) {
      if (!navigator.clipboard.readText) return
      const current = await navigator.clipboard.readText()
      if (current !== expected) return
    }

    await navigator.clipboard.writeText('')
  } catch {
    // 无读取权限时不强行写入，避免覆盖用户新复制的内容
  }
}

/** 应用锁定时立即清除仍由本应用写入剪贴板的敏感内容 */
export async function clearSensitiveClipboardOnLock(): Promise<void> {
  cancelScheduledClear()
  await clearIfStillOwned(true)
}

/** 复制敏感文本，并按设置在一段时间后自动清空剪贴板（仅当内容未被替换时） */
export async function copySensitiveText(text: string): Promise<boolean> {
  const normalized = text.trim()
  if (!normalized) return false

  let copied = false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalized)
      copied = true
    }
  } catch {
    // fallback below
  }

  if (!copied) {
    copied = copyViaExecCommand(normalized)
  }

  if (copied) {
    scheduleClear(normalized)
  }

  return copied
}

/** 复制成功提示：若已启用自动清空，附加倒计时说明 */
export function appendClipboardClearHint(
  message: string,
  t: (key: string, params?: Record<string, string | number>) => string
): string {
  const clearSeconds = useClipboardClearStore().clearSeconds
  if (clearSeconds <= 0) return message
  return `${message}（${t('msg.sensitiveCopiedClearHint', { seconds: clearSeconds })}）`
}
