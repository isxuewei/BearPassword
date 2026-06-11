package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 发送注册验证码请求
 */
@Data
public class SendRegisterCodeRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
}
