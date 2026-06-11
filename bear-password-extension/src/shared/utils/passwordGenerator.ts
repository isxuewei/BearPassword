const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*-_=+'

export interface PasswordGeneratorOptions {
  length?: number
  lowercase?: boolean
  uppercase?: boolean
  digits?: boolean
  symbols?: boolean
}

export function generatePassword(options: PasswordGeneratorOptions = {}): string {
  const length = Math.max(8, Math.min(64, options.length ?? 20))
  let charset = ''
  if (options.lowercase !== false) charset += LOWER
  if (options.uppercase !== false) charset += UPPER
  if (options.digits !== false) charset += DIGITS
  if (options.symbols !== false) charset += SYMBOLS
  if (!charset) charset = LOWER + UPPER + DIGITS

  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => charset[b % charset.length]).join('')
}
