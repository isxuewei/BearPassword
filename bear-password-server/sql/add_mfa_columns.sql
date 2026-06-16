-- 2FA：用户 TOTP 字段
ALTER TABLE bp_user
    ADD COLUMN totp_secret_encrypted VARCHAR(512) NULL COMMENT 'TOTP 密钥（AES 加密，Base64）' AFTER secret_key_fingerprint,
    ADD COLUMN totp_enabled TINYINT NOT NULL DEFAULT 0 COMMENT '是否启用 TOTP：0-否 1-是' AFTER totp_secret_encrypted;
