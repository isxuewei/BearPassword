import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { URL } from 'node:url'
import {
  EXTENSION_BRIDGE_AUTH_HEADER,
  EXTENSION_BRIDGE_HOST,
  EXTENSION_BRIDGE_PORT,
  type ExtensionBridgeMethod
} from '../../shared/extensionBridge'
import {
  hasAllowedBridgeAccess,
  isAllowedExtensionOrigin,
  isBridgeHeaderRequested,
  isPrivateNetworkAccessRequested
} from './extensionBridgeAccess'

type BridgeInvoker = (method: ExtensionBridgeMethod, params: unknown) => Promise<unknown>
type FocusHandler = () => void

let bridgeInvoker: BridgeInvoker | null = null
let focusHandler: FocusHandler | null = null
let server: Server | null = null

function writeJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  corsOrigin?: string | null
): void {
  const payload = JSON.stringify(body)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8'
  }
  if (corsOrigin) {
    headers['Access-Control-Allow-Origin'] = corsOrigin
    headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    headers['Access-Control-Allow-Headers'] = `Content-Type, Accept, ${EXTENSION_BRIDGE_AUTH_HEADER}`
    headers['Vary'] = 'Origin'
  }
  res.writeHead(status, headers)
  res.end(payload)
}

function writeNoContent(
  res: ServerResponse,
  corsOrigin: string,
  options?: { allowPrivateNetwork?: boolean }
): void {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': `Content-Type, Accept, ${EXTENSION_BRIDGE_AUTH_HEADER}`,
    Vary: 'Origin'
  }
  if (options?.allowPrivateNetwork) {
    headers['Access-Control-Allow-Private-Network'] = 'true'
  }
  res.writeHead(204, headers)
  res.end()
}

function getHeaderValue(req: IncomingMessage, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return value
}

function getCorsOrigin(req: IncomingMessage): string | null {
  const origin = getHeaderValue(req, 'origin')
  return isAllowedExtensionOrigin(origin) ? origin! : null
}

function hasBridgeAuthHeader(req: IncomingMessage): boolean {
  return hasAllowedBridgeAccess({
    origin: getHeaderValue(req, 'origin'),
    bridgeHeader: req.headers[EXTENSION_BRIDGE_AUTH_HEADER.toLowerCase()]
  })
}

function rejectForbidden(res: ServerResponse, corsOrigin?: string | null): void {
  writeJson(res, 403, { code: 403, message: 'Forbidden', data: null }, corsOrigin)
}

function isAllowedPreflight(req: IncomingMessage): boolean {
  const origin = getHeaderValue(req, 'origin')
  const requestHeaders = getHeaderValue(req, 'access-control-request-headers')
  return isAllowedExtensionOrigin(origin) && isBridgeHeaderRequested(requestHeaders)
}

function shouldAllowPrivateNetworkPreflight(req: IncomingMessage): boolean {
  return isPrivateNetworkAccessRequested(
    getHeaderValue(req, 'access-control-request-private-network')
  )
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) return null
  return JSON.parse(raw) as unknown
}

async function invoke(method: ExtensionBridgeMethod, params: unknown): Promise<unknown> {
  if (!bridgeInvoker) {
    throw new Error('桌面端桥接未就绪')
  }
  return bridgeInvoker(method, params)
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    const corsOrigin = getCorsOrigin(req)
    if (!corsOrigin || !isAllowedPreflight(req)) {
      rejectForbidden(res, corsOrigin)
      return
    }
    writeNoContent(res, corsOrigin, {
      allowPrivateNetwork: shouldAllowPrivateNetworkPreflight(req)
    })
    return
  }

  const corsOrigin = getCorsOrigin(req)
  if (!hasBridgeAuthHeader(req)) {
    rejectForbidden(res, corsOrigin)
    return
  }

  try {
    const url = new URL(req.url ?? '/', `http://${EXTENSION_BRIDGE_HOST}:${EXTENSION_BRIDGE_PORT}`)
    const pathname = url.pathname

    if (req.method === 'GET' && pathname === '/health') {
      const data = await invoke('health', null)
      writeJson(res, 200, { code: 0, message: 'ok', data }, corsOrigin)
      return
    }

    if (req.method === 'POST' && pathname === '/desktop/focus') {
      if (!focusHandler) {
        throw new Error('桌面端窗口未就绪')
      }
      focusHandler()
      writeJson(res, 200, { code: 0, message: 'ok', data: null }, corsOrigin)
      return
    }

    if (req.method === 'GET' && pathname === '/vault/match') {
      const data = await invoke('matchCredentials', {
        url: url.searchParams.get('url') ?? '',
        matchBy: url.searchParams.get('matchBy') ?? 'host'
      })
      writeJson(res, 200, { code: 0, message: 'ok', data }, corsOrigin)
      return
    }

    const credentialMatch = pathname.match(/^\/vault\/credentials\/(\d{1,20})$/)
    if (credentialMatch) {
      const id = credentialMatch[1]
      if (req.method === 'GET') {
        const data = await invoke('getCredential', { id })
        writeJson(res, 200, { code: 0, message: 'ok', data }, corsOrigin)
        return
      }
      if (req.method === 'PUT') {
        const body = (await readJsonBody(req)) as Record<string, unknown>
        await invoke('updateCredential', { ...body, credentialId: id })
        writeJson(res, 200, { code: 0, message: 'ok', data: null }, corsOrigin)
        return
      }
      if (req.method === 'DELETE') {
        await invoke('deleteCredential', { id })
        writeJson(res, 200, { code: 0, message: 'ok', data: null }, corsOrigin)
        return
      }
    }

    if (req.method === 'POST' && pathname === '/vault/credentials') {
      const body = await readJsonBody(req)
      await invoke('createCredential', body)
      writeJson(res, 200, { code: 0, message: 'ok', data: null }, corsOrigin)
      return
    }

    const favoriteMatch = pathname.match(/^\/vault\/favorites\/(\d{1,20})\/toggle$/)
    if (req.method === 'POST' && favoriteMatch) {
      const credentialId = favoriteMatch[1]
      const body = (await readJsonBody(req)) as { favorite?: boolean }
      await invoke('toggleFavorite', { credentialId, favorite: !!body?.favorite })
      writeJson(res, 200, { code: 0, message: 'ok', data: null }, corsOrigin)
      return
    }

    writeJson(res, 404, { code: 404, message: 'Not Found', data: null }, corsOrigin)
  } catch (err) {
    const message = err instanceof Error ? err.message : '桌面端处理失败'
    writeJson(res, 400, { code: 400, message, data: null }, corsOrigin)
  }
}

export function setExtensionBridgeInvoker(invoker: BridgeInvoker): void {
  bridgeInvoker = invoker
}

export function setExtensionBridgeFocusHandler(handler: FocusHandler): void {
  focusHandler = handler
}

export function startExtensionBridgeServer(): void {
  if (server) return

  server = createServer((req, res) => {
    void handleRequest(req, res)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[extension-bridge] 端口 ${EXTENSION_BRIDGE_PORT} 已被占用`)
      return
    }
    console.error('[extension-bridge] 服务异常', err)
  })

  server.listen(EXTENSION_BRIDGE_PORT, EXTENSION_BRIDGE_HOST, () => {
    console.info(
      `[extension-bridge] listening on http://${EXTENSION_BRIDGE_HOST}:${EXTENSION_BRIDGE_PORT}`
    )
  })
}

export function stopExtensionBridgeServer(): void {
  if (!server) return
  server.close()
  server = null
}
