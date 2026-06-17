import type { ExtensionBridgeCallPayload, ExtensionBridgeCallResult } from '../../shared/extensionBridge'
import { extensionBridgeHandlers } from '@/extensionBridge/handlers'

export function registerExtensionBridgeClient(): void {
  if (!window.extensionBridgeApi) return

  window.extensionBridgeApi.onRequest(async (payload: ExtensionBridgeCallPayload) => {
    const { id, method, params } = payload
    try {
      const handler = extensionBridgeHandlers[method]
      if (!handler) {
        throw new Error(`未知桥接方法: ${method}`)
      }
      const data = await handler(params)
      const result: ExtensionBridgeCallResult = { ok: true, data }
      window.extensionBridgeApi!.sendResponse(id, result)
    } catch (err) {
      const result: ExtensionBridgeCallResult = {
        ok: false,
        error: err instanceof Error ? err.message : '桌面端处理失败'
      }
      window.extensionBridgeApi!.sendResponse(id, result)
    }
  })
}
