package com.bear.password.module.version.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.bear.password.module.version.dto.VersionLatestResponse;
import com.bear.password.module.version.entity.AppVersion;
import com.bear.password.module.version.mapper.AppVersionMapper;
import com.bear.password.module.version.service.VersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 版本服务实现
 */
@Service
@RequiredArgsConstructor
public class VersionServiceImpl implements VersionService {

    private final AppVersionMapper appVersionMapper;

    @Override
    public VersionLatestResponse getLatestBySystem(String system) {
        if (!StringUtils.hasText(system)) {
            return null;
        }

        AppVersion latest = appVersionMapper.selectOne(
                Wrappers.<AppVersion>lambdaQuery()
                        .eq(AppVersion::getSystemInfo, system.trim())
                        .orderByDesc(AppVersion::getCreateTime)
                        .last("LIMIT 1")
        );
        if (latest == null) {
            return null;
        }

        return new VersionLatestResponse(
                latest.getSystemInfo(),
                latest.getVersionCode(),
                latest.getDownloadUrl(),
                latest.getCreateTime()
        );
    }
}
