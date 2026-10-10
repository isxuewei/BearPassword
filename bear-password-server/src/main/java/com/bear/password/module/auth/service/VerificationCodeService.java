package com.bear.password.module.auth.service;

import com.bear.password.common.config.AppRedisProperties;
import com.bear.password.common.config.RegisterProperties;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.bcrypt.BCrypt;
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

        stringRedisTemplate.delete(failKey(purpose, normalizedIdentifier));
        stringRedisTemplate.delete(lockKey(purpose, normalizedIdentifier));
        stringRedisTemplate.opsForValue().set(codeKey, hashCode(code), Duration.ofMinutes(expireMinutes));
        stringRedisTemplate.opsForValue().set(sendLockKey, "1", Duration.ofSeconds(intervalSeconds));
    }

    public void verifyAndConsume(VerificationPurpose purpose, String identifier, String code) {
        String normalizedIdentifier = normalizeIdentifier(purpose, identifier);
        String lockKey = lockKey(purpose, normalizedIdentifier);
        if (StringUtils.hasText(stringRedisTemplate.opsForValue().get(lockKey))) {
            throw new BusinessException(ResultCode.TOO_MANY_REQUESTS.getCode(), "验证码错误次数过多，请稍后重新获取");
        }

        String codeKey = appRedisProperties.key(purpose.getCodeSegment() + normalizedIdentifier);
        String storedHash = stringRedisTemplate.opsForValue().get(codeKey);

        if (!StringUtils.hasText(storedHash)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "验证码已过期，请重新获取");
        }

        if (!BCrypt.checkpw(code.trim(), storedHash)) {
            if (recordFailedAttempt(purpose, normalizedIdentifier)) {
                throw new BusinessException(ResultCode.TOO_MANY_REQUESTS.getCode(), "验证码错误次数过多，请稍后重新获取");
            }
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "验证码不正确");
        }

        stringRedisTemplate.delete(codeKey);
        stringRedisTemplate.delete(failKey(purpose, normalizedIdentifier));
        stringRedisTemplate.delete(lockKey);
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

    private String hashCode(String code) {
        return BCrypt.hashpw(code, BCrypt.gensalt());
    }

    private boolean recordFailedAttempt(VerificationPurpose purpose, String normalizedIdentifier) {
        String failKey = failKey(purpose, normalizedIdentifier);
        Long attempts = stringRedisTemplate.opsForValue().increment(failKey);
        if (attempts != null && attempts == 1L) {
            stringRedisTemplate.expire(
                    failKey,
                    Duration.ofMinutes(registerProperties.getRegister().getCodeExpireMinutes())
            );
        }

        if (attempts != null && attempts >= registerProperties.getRegister().getVerifyMaxAttempts()) {
            stringRedisTemplate.opsForValue().set(
                    lockKey(purpose, normalizedIdentifier),
                    "1",
                    Duration.ofSeconds(registerProperties.getRegister().getVerifyLockSeconds())
            );
            return true;
        }
        return false;
    }

    private String failKey(VerificationPurpose purpose, String normalizedIdentifier) {
        return appRedisProperties.key(purpose.name().toLowerCase() + ":verify-fail:" + normalizedIdentifier);
    }

    private String lockKey(VerificationPurpose purpose, String normalizedIdentifier) {
        return appRedisProperties.key(purpose.name().toLowerCase() + ":verify-lock:" + normalizedIdentifier);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
