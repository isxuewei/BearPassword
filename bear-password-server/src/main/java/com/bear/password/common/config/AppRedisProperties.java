package com.bear.password.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Redis 键前缀等业务配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "bear.password.redis")
public class AppRedisProperties {

    /** 全局键前缀，避免与其他应用冲突 */
    private String keyPrefix = "bear:password";

    public String key(String segment) {
        return keyPrefix + ":" + segment;
    }
}
