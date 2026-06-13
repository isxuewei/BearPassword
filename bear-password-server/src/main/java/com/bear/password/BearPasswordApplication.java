package com.bear.password;

import com.bear.password.common.config.TimeZoneConfig;
import org.dromara.x.file.storage.spring.EnableFileStorage;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

/**
 * BearPassword 后端启动类
 */
@EnableFileStorage
@SpringBootApplication
@MapperScan("com.bear.password.module.**.mapper")
public class BearPasswordApplication {

    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone(TimeZoneConfig.APP_ZONE));
        SpringApplication.run(BearPasswordApplication.class, args);
    }
}
