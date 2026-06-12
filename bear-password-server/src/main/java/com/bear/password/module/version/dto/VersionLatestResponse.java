package com.bear.password.module.version.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 指定系统最新版本信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VersionLatestResponse {

    private String system;

    private String versionCode;

    private String downloadUrl;

    private LocalDateTime createTime;
}
