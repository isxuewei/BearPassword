package com.bear.password.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 保险库加密元数据（不含任何密钥明文）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VaultCryptoResponse {

    private String vaultSalt;
    private String secretKeyFingerprint;
}
