package com.bear.password.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * MFA 配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "bear.password.mfa")
public class MfaProperties {

    /**
     * TOTP 密钥 AES 加密用密钥（Base64，32 字节）
     */
    private String totpEncryptionKey = "";

    /**
     * MFA 登录挑战有效期（秒）
     */
    private int sessionTtlSeconds = 300;
}
