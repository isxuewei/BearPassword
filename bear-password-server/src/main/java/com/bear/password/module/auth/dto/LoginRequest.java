package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 登录请求 DTO
 */
@Data
public class LoginRequest {

    @NotBlank(message = "请输入用户名或邮箱")
    private String username;

    @NotBlank(message = "密码不能为空")
    private String password;
}
