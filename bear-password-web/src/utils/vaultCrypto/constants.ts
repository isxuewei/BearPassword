/** 保险库加密：主密码 KDF */
export const MASTER_PASSWORD_PEPPER = new TextEncoder().encode('bear-password-master-password-v2')
export const MASTER_PASSWORD_ITERATIONS = 600_000

/** HKDF info 字符串 */
export const VUK_HKDF_INFO = new TextEncoder().encode('bear-password-vuk-v2')
export const ITEM_KEY_HKDF_INFO = new TextEncoder().encode('bear-password-item-v2')

/** 条目 content 加密版本 */
export const CRYPTO_VERSION_V2 = 2

export const ACCOUNT_SECRET_KEY_LENGTH = 128
