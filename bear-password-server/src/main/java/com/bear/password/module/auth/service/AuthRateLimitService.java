package com.bear.password.module.auth.service;

import com.bear.password.common.config.AppRedisProperties;
import com.bear.password.common.config.AuthRateLimitProperties;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;

/**
 * 认证接口固定窗口限流：同时限制 IP 与账号/邮箱/会话 token 维度。
 */
@Service
@RequiredArgsConstructor
public class AuthRateLimitService {

    private final AuthRateLimitProperties properties;
    private final AppRedisProperties appRedisProperties;
    private final StringRedisTemplate stringRedisTemplate;

    public void check(String action, String ip, String accountIdentifier) {
        if (!properties.isEnabled()) {
            return;
        }
        String normalizedAction = normalizeSegment(action);
        String normalizedIp = normalizeSegment(ip);
        assertWithinLimit(
                key(normalizedAction, "ip", normalizedIp),
                properties.getIpMaxAttempts()
        );

        if (StringUtils.hasText(accountIdentifier)) {
            assertWithinLimit(
                    key(normalizedAction, "account", normalizeSegment(accountIdentifier.toLowerCase())),
                    properties.getAccountMaxAttempts()
            );
        }
    }

    private void assertWithinLimit(String key, int maxAttempts) {
        Long count = stringRedisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            stringRedisTemplate.expire(key, Duration.ofSeconds(properties.getWindowSeconds()));
        }
        if (count != null && count > maxAttempts) {
            throw new BusinessException(ResultCode.TOO_MANY_REQUESTS.getCode(), "请求过于频繁，请稍后再试");
        }
    }

    private String key(String action, String dimension, String value) {
        return appRedisProperties.key("rate:" + action + ":" + dimension + ":" + value);
    }

    private String normalizeSegment(String value) {
        if (!StringUtils.hasText(value)) {
            return "unknown";
        }
        return value.trim()
                .replaceAll("[^A-Za-z0-9._@:-]", "_");
    }
}
