import { DESKTOP_WAKE_PROTOCOL_URL } from '@/shared/constants/extensionBridge'

export type WakeDesktopResult = 'focused' | 'protocol-on-tab' | 'fallback-page'

/** 在当前页面通过隐藏链接触发自定义协议，避免新开空白页签 */
export function triggerDesktopProtocolUrl(url = DESKTOP_WAKE_PROTOCOL_URL): void {
  const link = document.createElement('a')
  link.href = url
  link.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;width:0;height:0'
  document.documentElement.appendChild(link)
  link.click()
  link.remove()
}

export function isWakeableWebTabUrl(url?: string): boolean {
  if (!url) return false
  return url.startsWith('http://') || url.startsWith('https://')
}

/** 供 scripting.executeScript 注入页面使用（须保持自包含） */
export function triggerDesktopProtocolInPage(url: string): void {
  const link = document.createElement('a')
  link.href = url
  link.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;width:0;height:0'
  document.documentElement.appendChild(link)
  link.click()
  link.remove()
}

export async function triggerProtocolOnTab(tabId: number): Promise<boolean> {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_DESKTOP_PROTOCOL' })
    return true
  } catch {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: triggerDesktopProtocolInPage,
        args: [DESKTOP_WAKE_PROTOCOL_URL]
      })
      return true
    } catch {
      return false
    }
  }
}

export function getWakeFallbackPageUrl(): string {
  return chrome.runtime.getURL('src/wake/index.html')
}
