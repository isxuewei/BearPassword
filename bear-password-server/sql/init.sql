SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for bp_announcement
-- ----------------------------
DROP TABLE IF EXISTS `bp_announcement`;
CREATE TABLE `bp_announcement` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '标题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '公告内容',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- ----------------------------
-- Table structure for bp_announcement_confirm
-- ----------------------------
DROP TABLE IF EXISTS `bp_announcement_confirm`;
CREATE TABLE `bp_announcement_confirm` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `announcement_id` bigint NOT NULL COMMENT '公告 ID',
  `user_id` bigint NOT NULL COMMENT '用户 ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告确认表';

-- ----------------------------
-- Table structure for bp_password
-- ----------------------------
DROP TABLE IF EXISTS `bp_password`;
CREATE TABLE `bp_password` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` bigint NOT NULL COMMENT '用户 ID',
  `password_type` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码类型：登录信息、银行卡、身份信息、自定义',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码内容',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2068850013106212867 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码表';

-- ----------------------------
-- Table structure for bp_password_collection
-- ----------------------------
DROP TABLE IF EXISTS `bp_password_collection`;
CREATE TABLE `bp_password_collection` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` bigint NOT NULL COMMENT '用户 ID',
  `password_id` bigint NOT NULL COMMENT '密码 ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_password` (`user_id`,`password_id`)
) ENGINE=InnoDB AUTO_INCREMENT=198 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码收藏表';

-- ----------------------------
-- Table structure for bp_password_recent_visit
-- ----------------------------
DROP TABLE IF EXISTS `bp_password_recent_visit`;
CREATE TABLE `bp_password_recent_visit` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` bigint NOT NULL COMMENT '用户 ID',
  `password_id` bigint NOT NULL COMMENT '密码 ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_password` (`user_id`,`password_id`)
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='密码最近访问表';

-- ----------------------------
-- Table structure for bp_user
-- ----------------------------
DROP TABLE IF EXISTS `bp_user`;
CREATE TABLE `bp_user` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户名',
  `srp_salt` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SRP salt（hex）',
  `srp_verifier` varchar(2048) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SRP verifier（hex）',
  `vault_salt` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '保险库 KDF 盐（Base64）',
  `secret_key_fingerprint` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '账户密钥 SHA-256 指纹（Base64）',
  `totp_secret_encrypted` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'TOTP 密钥（AES 加密，Base64）',
  `totp_enabled` tinyint NOT NULL DEFAULT '0' COMMENT '是否启用 TOTP：0-否 1-是',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '头像 URL',
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮箱地址',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态：0-禁用 1-正常',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `last_login_time` datetime DEFAULT NULL COMMENT '上次登录时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=350 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ----------------------------
-- Table structure for bp_version
-- ----------------------------
DROP TABLE IF EXISTS `bp_version`;
CREATE TABLE `bp_version` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `system_info` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '系统信息',
  `version_code` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '版本号',
  `download_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '下载地址',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` tinyint NOT NULL DEFAULT '0' COMMENT '逻辑删除：0-未删除 1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统版本表';

SET FOREIGN_KEY_CHECKS = 1;
