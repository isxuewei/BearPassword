import type { ExtensionMessage } from '@/shared/types'
import {
  ExtensionContextInvalidatedError,
  isExtensionContextValid
} from '@/shared/utils/extensionContext'

export function sendMessage<T = unknown>(message: ExtensionMessage): Promise<T> {
  if (!isExtensionContextValid()) {
    return Promise.reject(new ExtensionContextInvalidatedError())
  }

  return new Promise((resolve, reject) => {
    try {
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
    } catch (error) {
      reject(error)
    }
  })
}

export function sendTabMessage<T = unknown>(tabId: number, message: ExtensionMessage): Promise<T> {
  if (!isExtensionContextValid()) {
    return Promise.reject(new ExtensionContextInvalidatedError())
  }

  return new Promise((resolve, reject) => {
    try {
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
    } catch (error) {
      reject(error)
    }
  })
}
