package com.bear.password.common.config;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;
import java.util.TimeZone;

/**
 * 统一应用时区，避免部署环境默认 UTC 导致时间偏差 8 小时
 */
@Slf4j
@Configuration
public class TimeZoneConfig {

    public static final ZoneId APP_ZONE = ZoneId.of("Asia/Shanghai");

    @PostConstruct
    public void init() {
        TimeZone.setDefault(TimeZone.getTimeZone(APP_ZONE));
        log.info("应用时区已设置为：{}", APP_ZONE);
    }
}
