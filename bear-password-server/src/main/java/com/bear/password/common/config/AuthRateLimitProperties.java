package com.bear.password.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 认证相关接口固定窗口限流配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "bear.password.auth-rate-limit")
public class AuthRateLimitProperties {

    private boolean enabled = true;
    private int windowSeconds = 60;
    private int ipMaxAttempts = 60;
    private int accountMaxAttempts = 10;
}
