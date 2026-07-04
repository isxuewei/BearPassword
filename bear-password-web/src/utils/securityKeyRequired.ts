/** 未配置安全密钥时禁止写入保险库 */
export class SecurityKeyRequiredError extends Error {
  readonly code = 'SECURITY_KEY_REQUIRED'

  constructor(message = '请先配置安全密钥后再保存密码') {
    super(message)
    this.name = 'SecurityKeyRequiredError'
  }
}
