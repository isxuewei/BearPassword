package com.bear.password.module.auth.mfa.support;

import com.bear.password.common.config.MfaProperties;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

/**
 * TOTP 密钥静态加密（服务端 at-rest 保护）
 */
@Component
public class TotpSecretCodec {

    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    private final byte[] encryptionKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public TotpSecretCodec(MfaProperties mfaProperties) {
        this.encryptionKey = resolveKey(mfaProperties.getTotpEncryptionKey());
    }

    public String encrypt(String plainSecret) {
        if (!StringUtils.hasText(plainSecret)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "TOTP 密钥无效");
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] ciphertext = cipher.doFinal(plainSecret.trim().getBytes());
            ByteBuffer buffer = ByteBuffer.allocate(iv.length + ciphertext.length);
            buffer.put(iv);
            buffer.put(ciphertext);
            return Base64.getEncoder().encodeToString(buffer.array());
        } catch (Exception ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "TOTP 密钥加密失败");
        }
    }

    public String decrypt(String encrypted) {
        if (!StringUtils.hasText(encrypted)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "TOTP 密钥无效");
        }
        try {
            byte[] payload = Base64.getDecoder().decode(encrypted.trim());
            ByteBuffer buffer = ByteBuffer.wrap(payload);
            byte[] iv = new byte[GCM_IV_LENGTH];
            buffer.get(iv);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(encryptionKey, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(ciphertext));
        } catch (Exception ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "TOTP 密钥解密失败");
        }
    }

    private byte[] resolveKey(String configured) {
        if (StringUtils.hasText(configured)) {
            byte[] decoded = Base64.getDecoder().decode(configured.trim());
            if (decoded.length != 32) {
                throw new IllegalStateException("bear.password.mfa.totp-encryption-key 必须为 Base64 编码的 32 字节密钥");
            }
            return decoded;
        }
        // 开发环境回退（生产务必通过环境变量配置）
        return Arrays.copyOf("bear-password-dev-totp-key".getBytes(StandardCharsets.UTF_8), 32);
    }
}
