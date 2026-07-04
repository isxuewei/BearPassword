/** 密码条目 ID（雪花 ID 必须以字符串传递，避免 JS Number 精度丢失） */
export type VaultEntryId = string

export function toVaultEntryId(id: string | number | bigint | null | undefined): VaultEntryId {
  if (id === null || id === undefined) return ''
  if (typeof id === 'bigint') return id.toString()
  if (typeof id === 'number') {
    if (!Number.isFinite(id)) return ''
    return String(id)
  }
  return id.trim()
}

export function sameVaultEntryId(
  a: string | number | null | undefined,
  b: string | number | null | undefined
): boolean {
  return toVaultEntryId(a) === toVaultEntryId(b)
}
