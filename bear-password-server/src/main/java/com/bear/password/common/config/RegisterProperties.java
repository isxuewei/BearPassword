package com.bear.password.common.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 注册与邮件相关配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "bear.password")
public class RegisterProperties {

    private Mail mail = new Mail();
    private Register register = new Register();

    @Data
    public static class Mail {
        /**
         * 发件人显示名称
         */
        private String fromName = "BearPassword";
    }

    @Data
    public static class Register {
        /**
         * 验证码有效期（分钟）
         */
        private int codeExpireMinutes = 5;
        /**
         * 同一邮箱发送间隔（秒）
         */
        private int sendIntervalSeconds = 60;
        /**
         * 同一验证码允许的最大错误次数
         */
        private int verifyMaxAttempts = 5;
        /**
         * 验证码错误次数过多后的锁定时长（秒）
         */
        private int verifyLockSeconds = 300;
    }
}
