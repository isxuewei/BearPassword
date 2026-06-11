package com.bear.password;

import org.dromara.x.file.storage.spring.EnableFileStorage;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * BearPassword 后端启动类
 */
@EnableFileStorage
@SpringBootApplication
@MapperScan("com.bear.password.module.**.mapper")
public class BearPasswordApplication {

    public static void main(String[] args) {
        SpringApplication.run(BearPasswordApplication.class, args);
    }
}
