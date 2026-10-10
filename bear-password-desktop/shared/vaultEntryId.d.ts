/** 密码条目 ID（雪花 ID 必须以字符串传递，避免 JS Number 精度丢失） */
export type VaultEntryId = string;
export declare function toVaultEntryId(id: string | number | bigint | null | undefined): VaultEntryId;
export declare function sameVaultEntryId(a: string | number | null | undefined, b: string | number | null | undefined): boolean;
