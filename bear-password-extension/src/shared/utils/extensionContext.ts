export class ExtensionContextInvalidatedError extends Error {
  constructor() {
    super('Extension context invalidated')
    this.name = 'ExtensionContextInvalidatedError'
  }
}

export function isExtensionContextValid(): boolean {
  try {
    return Boolean(chrome.runtime?.id)
  } catch {
    return false
  }
}

export function isExtensionContextInvalidatedError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('Extension context invalidated')
}
