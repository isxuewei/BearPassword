package com.bear.password.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 更换密钥验证码发送结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecurityKeyChangeCodeResponse {

    /** 脱敏后的邮箱地址 */
    private String maskedEmail;
}
