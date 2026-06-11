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
    private static final String REGISTER_CODE_SEGMENT = "register:code:";
    private static final String REGISTER_SEND_LOCK_SEGMENT = "register:send-lock:";

    private final RegisterProperties registerProperties;
    private final AppRedisProperties appRedisProperties;
    private final StringRedisTemplate stringRedisTemplate;

    public void sendCode(String email, Consumer<String> sender) {
        String normalizedEmail = normalizeEmail(email);
        String sendLockKey = appRedisProperties.key(REGISTER_SEND_LOCK_SEGMENT + normalizedEmail);

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
        String codeKey = appRedisProperties.key(REGISTER_CODE_SEGMENT + normalizedEmail);

        stringRedisTemplate.opsForValue().set(codeKey, code, Duration.ofMinutes(expireMinutes));
        stringRedisTemplate.opsForValue().set(sendLockKey, "1", Duration.ofSeconds(intervalSeconds));
    }

    public void verifyAndConsume(String email, String code) {
        String normalizedEmail = normalizeEmail(email);
        String codeKey = appRedisProperties.key(REGISTER_CODE_SEGMENT + normalizedEmail);
        String storedCode = stringRedisTemplate.opsForValue().get(codeKey);

        if (!StringUtils.hasText(storedCode)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "验证码已过期，请重新获取");
        }

        if (!storedCode.equals(code.trim())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "验证码不正确");
        }

        stringRedisTemplate.delete(codeKey);
    }

    private String generateCode() {
        int value = RANDOM.nextInt(900_000) + 100_000;
        return String.valueOf(value);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
