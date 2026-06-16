package com.bear.password.module.auth.service;

import com.bear.password.common.config.AppRedisProperties;
import com.bear.password.common.config.RegisterProperties;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * 注册邮箱验证码管理（Redis 存储）
 */
@Service
@RequiredArgsConstructor
public class VerificationCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final RegisterProperties registerProperties;
    private final AppRedisProperties appRedisProperties;
    private final StringRedisTemplate stringRedisTemplate;

    public void sendCode(VerificationPurpose purpose, String identifier, Consumer<String> sender) {
        String normalizedIdentifier = normalizeIdentifier(purpose, identifier);
        String sendLockKey = appRedisProperties.key(purpose.getLockSegment() + normalizedIdentifier);

        Long lockTtl = stringRedisTemplate.getExpire(sendLockKey, TimeUnit.SECONDS);
        if (lockTtl != null && lockTtl > 0) {
            throw new BusinessException(
                    ResultCode.BAD_REQUEST.getCode(),
                    "发送过于频繁，请 " + lockTtl + " 秒后再试"
            );
        }

        String code = generateCode();
        sender.accept(code);

        int expireMinutes = registerProperties.getRegister().getCodeExpireMinutes();
        int intervalSeconds = registerProperties.getRegister().getSendIntervalSeconds();
        String codeKey = appRedisProperties.key(purpose.getCodeSegment() + normalizedIdentifier);

        stringRedisTemplate.opsForValue().set(codeKey, code, Duration.ofMinutes(expireMinutes));
        stringRedisTemplate.opsForValue().set(sendLockKey, "1", Duration.ofSeconds(intervalSeconds));
    }

    public void verifyAndConsume(VerificationPurpose purpose, String identifier, String code) {
        String normalizedIdentifier = normalizeIdentifier(purpose, identifier);
        String codeKey = appRedisProperties.key(purpose.getCodeSegment() + normalizedIdentifier);
        String storedCode = stringRedisTemplate.opsForValue().get(codeKey);

        if (!StringUtils.hasText(storedCode)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "验证码已过期，请重新获取");
        }

        if (!storedCode.equals(code.trim())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "验证码不正确");
        }

        stringRedisTemplate.delete(codeKey);
    }

    private String normalizeIdentifier(VerificationPurpose purpose, String identifier) {
        if (!StringUtils.hasText(identifier)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "验证码标识无效");
        }
        if (purpose == VerificationPurpose.REGISTER) {
            return normalizeEmail(identifier);
        }
        return identifier.trim();
    }

    private String generateCode() {
        int value = RANDOM.nextInt(900_000) + 100_000;
        return String.valueOf(value);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
