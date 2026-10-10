import test from 'node:test'
import assert from 'node:assert/strict'
import {
  hasAllowedBridgeAccess,
  isAllowedExtensionOrigin,
  isBridgeHeaderRequested,
  isPrivateNetworkAccessRequested
} from './extensionBridgeAccess.js'

test('allows chrome and firefox extension origins only', () => {
  assert.equal(isAllowedExtensionOrigin('chrome-extension://devtest'), true)
  assert.equal(isAllowedExtensionOrigin('moz-extension://devtest'), true)
  assert.equal(isAllowedExtensionOrigin('https://evil.example'), false)
  assert.equal(isAllowedExtensionOrigin(undefined), false)
})

test('requires bridge header on real requests', () => {
  assert.equal(
    hasAllowedBridgeAccess({
      origin: 'chrome-extension://devtest',
      bridgeHeader: 'BearPassword-Extension'
    }),
    true
  )
  assert.equal(
    hasAllowedBridgeAccess({
      origin: undefined,
      bridgeHeader: 'BearPassword-Extension'
    }),
    true
  )
  assert.equal(
    hasAllowedBridgeAccess({
      origin: 'chrome-extension://devtest',
      bridgeHeader: undefined
    }),
    false
  )
  assert.equal(
    hasAllowedBridgeAccess({
      origin: 'https://evil.example',
      bridgeHeader: 'BearPassword-Extension'
    }),
    false
  )
})

test('requires bridge header in preflight request headers', () => {
  assert.equal(isBridgeHeaderRequested('content-type, x-bearpassword-bridge'), true)
  assert.equal(isBridgeHeaderRequested('Content-Type, X-BearPassword-Bridge'), true)
  assert.equal(isBridgeHeaderRequested('content-type'), false)
})

test('detects private network access preflight requests', () => {
  assert.equal(isPrivateNetworkAccessRequested('true'), true)
  assert.equal(isPrivateNetworkAccessRequested('TRUE'), true)
  assert.equal(isPrivateNetworkAccessRequested('false'), false)
  assert.equal(isPrivateNetworkAccessRequested(undefined), false)
})
