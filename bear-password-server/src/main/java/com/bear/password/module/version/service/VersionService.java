package com.bear.password.module.version.service;

import com.bear.password.module.version.dto.VersionLatestResponse;

/**
 * 版本服务
 */
public interface VersionService {

    /**
     * 按系统类型查询最新一条版本记录（按创建时间倒序）
     */
    VersionLatestResponse getLatestBySystem(String system);
}
