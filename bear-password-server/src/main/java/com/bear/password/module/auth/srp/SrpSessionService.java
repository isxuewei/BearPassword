package com.bear.password.module.auth.srp;

import com.bear.password.common.config.AppRedisProperties;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
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
public class SrpSessionService {

    private final StringRedisTemplate stringRedisTemplate;
    private final AppRedisProperties appRedisProperties;

    public String createSessionId() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public void saveLoginSession(String sessionId, SrpLoginSessionData data) {
        String key = sessionKey(sessionId);
        stringRedisTemplate.opsForValue().set(key, serialize(data), Duration.ofSeconds(SrpConstants.SESSION_TTL_SECONDS));
    }

    public SrpLoginSessionData consumeLoginSession(String sessionId) {
        String key = sessionKey(sessionId);
        String payload = stringRedisTemplate.opsForValue().get(key);
        if (!StringUtils.hasText(payload)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "登录会话已过期，请重试");
        }
        stringRedisTemplate.delete(key);
        return deserialize(payload);
    }

    public SrpLoginSessionData peekLoginSession(String sessionId) {
        String key = sessionKey(sessionId);
        String payload = stringRedisTemplate.opsForValue().get(key);
        if (!StringUtils.hasText(payload)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "登录会话已过期，请重试");
        }
        return deserialize(payload);
    }

    public void deleteLoginSession(String sessionId) {
        stringRedisTemplate.delete(sessionKey(sessionId));
    }

    public void savePasswordChangeToken(String token, Long userId) {
        stringRedisTemplate.opsForValue().set(
                passwordChangeKey(token),
                String.valueOf(userId),
                Duration.ofSeconds(120)
        );
    }

    public Long consumePasswordChangeToken(String token) {
        String key = passwordChangeKey(token);
        String userId = stringRedisTemplate.opsForValue().get(key);
        if (!StringUtils.hasText(userId)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "密码修改凭证已过期，请重新验证当前密码");
        }
        stringRedisTemplate.delete(key);
        return Long.parseLong(userId.trim());
    }

    private String sessionKey(String sessionId) {
        return appRedisProperties.key("srp:session:" + sessionId);
    }

    private String passwordChangeKey(String token) {
        return appRedisProperties.key("srp:password-change:" + token);
    }

    private String serialize(SrpLoginSessionData data) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            oos.writeObject(data);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception ex) {
            throw new IllegalStateException("SRP 会话序列化失败", ex);
        }
    }

    private SrpLoginSessionData deserialize(String payload) {
        try (ObjectInputStream ois = new ObjectInputStream(new ByteArrayInputStream(Base64.getDecoder().decode(payload)))) {
            return (SrpLoginSessionData) ois.readObject();
        } catch (Exception ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "SRP 会话解析失败");
        }
    }
}
