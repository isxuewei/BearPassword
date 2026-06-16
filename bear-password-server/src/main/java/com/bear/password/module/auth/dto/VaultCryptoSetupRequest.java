package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 注册时上传的保险库加密元数据
 */
@Data
public class VaultCryptoSetupRequest {

    @NotBlank(message = "vaultSalt 不能为空")
    @Size(max = 64, message = "vaultSalt 格式无效")
    private String vaultSalt;

    @NotBlank(message = "secretKeyFingerprint 不能为空")
    @Size(max = 64, message = "secretKeyFingerprint 格式无效")
    private String secretKeyFingerprint;
}
