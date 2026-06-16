package com.bear.password.module.auth.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 用户注册请求
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotBlank(message = "验证码不能为空")
    @Pattern(regexp = "^\\d{6}$", message = "验证码为 6 位数字")
    private String code;

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 32, message = "用户名长度需在 2-32 位之间")
    @Pattern(regexp = "^[\\u4e00-\\u9fff\\w]+$", message = "用户名仅支持中文、字母、数字和下划线")
    private String username;

    /**
     * SRP 凭证（客户端计算，密码不上传）
     */
    @Valid
    @NotNull(message = "注册需要 SRP 凭证")
    private SrpCredentialsSetup srp;

    /**
     * 保险库加密 v2 元数据（新用户必填）
     */
    @Valid
    @NotNull(message = "注册需要初始化保险库加密")
    private VaultCryptoSetupRequest vaultCrypto;

    /**
     * Emergency Kit 文件内容（仅用于注册成功后邮件备份，服务端不持久化）
     */
    @NotBlank(message = "Emergency Kit 内容不能为空")
    @Size(max = 8192, message = "Emergency Kit 内容过长")
    private String emergencyKitContent;
}
