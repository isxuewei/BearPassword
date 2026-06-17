package com.bear.password.common.config;

import com.baomidou.mybatisplus.core.incrementer.DefaultIdentifierGenerator;
import com.baomidou.mybatisplus.core.incrementer.IdentifierGenerator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 雪花 ID 生成器（与 MyBatis-Plus ASSIGN_ID 一致）
 * 离线客户端使用 workerId=2、datacenterId=2，服务端请保持不同取值。
 */
@Configuration
public class SnowflakeIdConfig {

    @Bean
    public IdentifierGenerator identifierGenerator(
            @Value("${bear.password.snowflake.worker-id:1}") long workerId,
            @Value("${bear.password.snowflake.datacenter-id:1}") long datacenterId
    ) {
        return new DefaultIdentifierGenerator(workerId, datacenterId);
    }
}
