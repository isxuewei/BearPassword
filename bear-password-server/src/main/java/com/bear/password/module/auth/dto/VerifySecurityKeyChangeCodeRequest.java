package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 更换密钥邮箱验证码校验请求
 */
@Data
public class VerifySecurityKeyChangeCodeRequest {

    @NotBlank(message = "验证码不能为空")
    @Pattern(regexp = "^\\d{6}$", message = "验证码为 6 位数字")
    private String code;
}
