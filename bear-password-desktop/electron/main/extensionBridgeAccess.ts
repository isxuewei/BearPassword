import {
  EXTENSION_BRIDGE_AUTH_HEADER,
  EXTENSION_BRIDGE_AUTH_VALUE
} from '../../shared/extensionBridge'

interface BridgeAccessInput {
  origin?: string
  bridgeHeader?: string | string[]
}

const EXTENSION_ORIGIN_PATTERN = /^(chrome|moz)-extension:\/\/[A-Za-z0-9_-]+$/

export function isAllowedExtensionOrigin(origin: string | undefined): boolean {
  return !!origin && EXTENSION_ORIGIN_PATTERN.test(origin)
}

export function isBridgeHeaderRequested(requestHeaders: string | undefined): boolean {
  if (!requestHeaders) return false
  return requestHeaders
    .split(',')
    .map((header) => header.trim().toLowerCase())
    .includes(EXTENSION_BRIDGE_AUTH_HEADER.toLowerCase())
}

export function isPrivateNetworkAccessRequested(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true'
}

function hasBridgeHeaderValue(value: string | string[] | undefined): boolean {
  const values = Array.isArray(value) ? value : [value]
  return values.some((item) => item === EXTENSION_BRIDGE_AUTH_VALUE)
}

function hasForbiddenOrigin(origin: string | undefined): boolean {
  return !!origin && !isAllowedExtensionOrigin(origin)
}

export function hasAllowedBridgeAccess(input: BridgeAccessInput): boolean {
  if (hasForbiddenOrigin(input.origin)) return false
  return hasBridgeHeaderValue(input.bridgeHeader)
}
