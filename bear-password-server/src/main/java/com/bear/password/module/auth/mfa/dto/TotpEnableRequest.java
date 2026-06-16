package com.bear.password.module.auth.mfa.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TotpEnableRequest {

    @NotBlank(message = "pendingToken 不能为空")
    private String pendingToken;

    @NotBlank(message = "验证码不能为空")
    @Pattern(regexp = "\\d{6}", message = "验证码格式无效")
    private String code;
}
