package com.bear.password.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 登录响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String username;
    private String avatar;
    /** 注册时是否已成功发送 Emergency Kit 邮件备份 */
    private Boolean emergencyKitEmailSent;
}
