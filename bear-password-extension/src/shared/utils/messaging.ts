import type { ExtensionMessage } from '@/shared/types'

export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (response?.error) {
        reject(new Error(response.error as string))
        return
      }
      resolve(response?.data as T)
    })
  })
}

export function sendTabMessage<T = unknown>(tabId: number, message: ExtensionMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
        return
      }
      if (response?.error) {
        reject(new Error(response.error as string))
        return
      }
      resolve(response?.data as T)
    })
  })
}
