/**
 * 银行卡 content 读写
 */
import type { BankCardContent, LoginExtraField } from '@/types'

export function createEmptyBankCardContent(): BankCardContent {
  return {
    title: '',
    bankName: '',
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    extraFields: []
  }
}

function normalizeExtraFields(raw: unknown): LoginExtraField[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    const field = item as Record<string, unknown>
    return {
      label: String(field.label ?? ''),
      value: String(field.value ?? '')
    }
  })
}

export function normalizeBankCardContent(raw: Record<string, unknown>): BankCardContent {
  return {
    title: String(raw.title ?? '银行卡'),
    bankName: String(raw.bankName ?? ''),
    cardHolder: String(raw.cardHolder ?? ''),
    cardNumber: String(raw.cardNumber ?? ''),
    expiry: String(raw.expiry ?? ''),
    cvv: String(raw.cvv ?? ''),
    extraFields: normalizeExtraFields(raw.extraFields)
  }
}

export function serializeBankCardContent(content: BankCardContent): Omit<BankCardContent, 'title'> {
  return {
    bankName: content.bankName.trim(),
    cardHolder: content.cardHolder.trim(),
    cardNumber: content.cardNumber.trim(),
    expiry: content.expiry.trim(),
    cvv: content.cvv.trim(),
    extraFields: content.extraFields.filter((field) => field.label.trim() || field.value.trim())
  }
}

export function getBankCardTitle(content: Record<string, unknown>): string {
  const card = normalizeBankCardContent(content)
  if (card.title.trim() && card.title !== '银行卡') return card.title
  if (card.bankName.trim()) return card.bankName
  return '银行卡'
}
