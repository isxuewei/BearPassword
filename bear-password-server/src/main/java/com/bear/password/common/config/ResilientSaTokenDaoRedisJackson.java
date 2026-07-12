package com.bear.password.common.config;

import cn.dev33.satoken.dao.SaTokenDaoRedisJackson;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.serializer.SerializationException;
import org.springframework.stereotype.Component;

/**
 * Sa-Token Redis Session 防护：
 * <p>
 * 重新登录时会读取已有 Account-Session。若 Redis 中残留不兼容数据
 * （例如缺少 Jackson {@code @class}），GenericJackson2JsonRedisSerializer
 * 会抛出 {@link SerializationException}，导致登录失败。
 * <p>
 * 反序列化失败时删除损坏 key，交由 Sa-Token 重建 Session。
 */
@Slf4j
@Component
public class ResilientSaTokenDaoRedisJackson extends SaTokenDaoRedisJackson {

    @Override
    public Object getObject(String key) {
        try {
            return super.getObject(key);
        } catch (SerializationException ex) {
            Throwable cause = ex.getMostSpecificCause();
            log.warn("Sa-Token Redis 反序列化失败，已删除损坏数据并允许重建: key={}, cause={}",
                    key, cause != null ? cause.getMessage() : ex.getMessage());
            deleteObject(key);
            return null;
        }
    }
}
