package com.bear.password.module.auth.service;

import com.bear.password.common.config.AppRedisProperties;
import com.bear.password.common.config.AuthRateLimitProperties;
import com.bear.password.common.exception.BusinessException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthRateLimitServiceTest {

    private AuthRateLimitProperties properties;
    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private AuthRateLimitService service;

    @BeforeEach
    void setUp() {
        properties = new AuthRateLimitProperties();
        properties.setEnabled(true);
        properties.setWindowSeconds(60);
        properties.setIpMaxAttempts(2);
        properties.setAccountMaxAttempts(2);
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        service = new AuthRateLimitService(properties, new AppRedisProperties(), redisTemplate);
    }

    @Test
    void rejectsWhenIpLimitExceeded() {
        when(valueOperations.increment("bear:password:rate:login:init:ip:127.0.0.1")).thenReturn(3L);

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> service.check("login:init", "127.0.0.1", "alice")
        );

        assertEquals(429, ex.getCode());
    }

    @Test
    void rejectsWhenAccountLimitExceeded() {
        when(valueOperations.increment("bear:password:rate:login:init:ip:127.0.0.1")).thenReturn(1L);
        when(valueOperations.increment("bear:password:rate:login:init:account:alice")).thenReturn(3L);

        BusinessException ex = assertThrows(
                BusinessException.class,
                () -> service.check("login:init", "127.0.0.1", "Alice")
        );

        assertEquals(429, ex.getCode());
    }

    @Test
    void setsTtlForNewCounters() {
        when(valueOperations.increment(anyString())).thenReturn(1L);

        service.check("login:init", "127.0.0.1", "alice");

        verify(redisTemplate).expire("bear:password:rate:login:init:ip:127.0.0.1", Duration.ofSeconds(60));
        verify(redisTemplate).expire("bear:password:rate:login:init:account:alice", Duration.ofSeconds(60));
    }
}
