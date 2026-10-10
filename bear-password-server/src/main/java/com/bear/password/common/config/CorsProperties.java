package com.bear.password.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * CORS 白名单配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "bear.password.cors")
public class CorsProperties {

    /**
     * 允许访问后端 API 的浏览器 Origin。
     */
    private List<String> allowedOrigins = new ArrayList<>();
}
