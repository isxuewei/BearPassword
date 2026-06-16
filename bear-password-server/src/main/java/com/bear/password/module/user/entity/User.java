package com.bear.password.module.user.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_user")
public class User extends BaseEntity {

    /**
     * 用户名
     */
    private String username;

    /**
     * SRP salt（hex）
     */
    private String srpSalt;

    /**
     * SRP verifier（hex）
     */
    private String srpVerifier;

    /**
     * 头像 URL
     */
    private String avatar;

    /**
     * 邮箱地址
     */
    private String email;

    /**
     * 状态：0-禁用 1-正常
     */
    private Integer status;

    /**
     * 上次登录时间
     */
    private LocalDateTime lastLoginTime;

    /**
     * 保险库 KDF 盐（Base64，公开）
     */
    private String vaultSalt;

    /**
     * 账户密钥 SHA-256 指纹（Base64）
     */
    private String secretKeyFingerprint;

    /**
     * TOTP 密钥（AES 加密后 Base64）
     */
    private String totpSecretEncrypted;

    /**
     * 是否启用 TOTP：0-否 1-是
     */
    private Integer totpEnabled;
}
