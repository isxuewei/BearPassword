package com.bear.password.module.auth.service;

import com.bear.password.common.config.AppRedisProperties;
import com.bear.password.common.config.RegisterProperties;
import com.bear.password.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class VerificationCodeServiceTest {

    private RegisterProperties registerProperties;
    private AppRedisProperties redisProperties;
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private VerificationCodeService service;

    @BeforeEach
    void setUp() {
        registerProperties = new RegisterProperties();
        registerProperties.getRegister().setCodeExpireMinutes(5);
        registerProperties.getRegister().setSendIntervalSeconds(60);
        registerProperties.getRegister().setVerifyMaxAttempts(5);
        registerProperties.getRegister().setVerifyLockSeconds(300);
        redisProperties = new AppRedisProperties();
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new VerificationCodeService(registerProperties, redisProperties, redisTemplate);
    }

    @Test
    void sendCodeStoresHashAndClearsFailedAttempts() {
        when(redisTemplate.getExpire(anyString(), eq(TimeUnit.SECONDS))).thenReturn(-1L);
        AtomicReference<String> sentCode = new AtomicReference<>();

        service.sendCode(VerificationPurpose.REGISTER, "USER@example.com", sentCode::set);

        assertNotNull(sentCode.get());
        ArgumentCaptor<String> storedCode = ArgumentCaptor.forClass(String.class);
        verify(valueOperations).set(eq("bear:password:register:code:user@example.com"), storedCode.capture(), any(Duration.class));
        assertNotEquals(sentCode.get(), storedCode.getValue());
        assertTrue(storedCode.getValue().startsWith("$2"));
        verify(redisTemplate).delete("bear:password:register:verify-fail:user@example.com");
        verify(redisTemplate).delete("bear:password:register:verify-lock:user@example.com");
    }

    @Test
    void verifyLocksAfterMaxWrongAttempts() {
        when(valueOperations.get("bear:password:register:verify-lock:user@example.com")).thenReturn(null);
        when(valueOperations.get("bear:password:register:code:user@example.com"))
                .thenReturn(org.springframework.security.crypto.bcrypt.BCrypt.hashpw("123456", org.springframework.security.crypto.bcrypt.BCrypt.gensalt()));
        when(valueOperations.increment("bear:password:register:verify-fail:user@example.com")).thenReturn(5L);

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> service.verifyAndConsume(VerificationPurpose.REGISTER, "user@example.com", "000000")
        );

        assertEquals(429, ex.getCode());
        verify(valueOperations).set(eq("bear:password:register:verify-lock:user@example.com"), eq("1"), eq(Duration.ofSeconds(300)));
    }
}
