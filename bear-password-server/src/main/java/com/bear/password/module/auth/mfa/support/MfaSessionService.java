package com.bear.password.module.auth.mfa.support;

import com.bear.password.common.config.AppRedisProperties;
import com.bear.password.common.config.MfaProperties;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.time.Duration;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MfaSessionService {

    private final StringRedisTemplate stringRedisTemplate;
    private final AppRedisProperties appRedisProperties;
    private final MfaProperties mfaProperties;

    public String createSession(User user) {
        MfaSessionData data = new MfaSessionData();
        data.setUserId(user.getId());
        data.setUsername(user.getUsername());
        data.setAvatar(user.getAvatar() != null ? user.getAvatar() : "");

        String token = UUID.randomUUID().toString().replace("-", "");
        stringRedisTemplate.opsForValue().set(
                sessionKey(token),
                serialize(data),
                Duration.ofSeconds(mfaProperties.getSessionTtlSeconds())
        );
        return token;
    }

    public MfaSessionData consumeSession(String token) {
        String key = sessionKey(token);
        String payload = stringRedisTemplate.opsForValue().get(key);
        if (!StringUtils.hasText(payload)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "二次验证已过期，请重新登录");
        }
        stringRedisTemplate.delete(key);
        return deserialize(payload);
    }

    public MfaSessionData peekSession(String token) {
        String payload = stringRedisTemplate.opsForValue().get(sessionKey(token));
        if (!StringUtils.hasText(payload)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "二次验证已过期，请重新登录");
        }
        return deserialize(payload);
    }

    public void savePendingTotpSecret(String pendingToken, String secret) {
        stringRedisTemplate.opsForValue().set(
                pendingTotpKey(pendingToken),
                secret,
                Duration.ofMinutes(10)
        );
    }

    public String consumePendingTotpSecret(String pendingToken) {
        String key = pendingTotpKey(pendingToken);
        String secret = stringRedisTemplate.opsForValue().get(key);
        if (!StringUtils.hasText(secret)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "TOTP 设置已过期，请重新获取二维码");
        }
        stringRedisTemplate.delete(key);
        return secret.trim();
    }

    private String sessionKey(String token) {
        return appRedisProperties.key("mfa:session:" + token);
    }

    private String pendingTotpKey(String token) {
        return appRedisProperties.key("mfa:totp:pending:" + token);
    }

    private String serialize(MfaSessionData data) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(data);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception ex) {
            throw new IllegalStateException("MFA 会话序列化失败", ex);
        }
    }

    private MfaSessionData deserialize(String payload) {
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(Base64.getDecoder().decode(payload)))) {
            return (MfaSessionData) ois.readObject();
        } catch (Exception ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "MFA 会话解析失败");
        }
    }
}
