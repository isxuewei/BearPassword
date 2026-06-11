package com.bear.password.module.dashboard.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.bear.password.module.collection.service.PasswordCollectionService;
import com.bear.password.module.dashboard.service.DashboardService;
import com.bear.password.module.password.entity.PasswordEntry;
import com.bear.password.module.password.mapper.PasswordEntryMapper;
import com.bear.password.module.recent.service.PasswordRecentVisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 仪表盘统计服务实现
 */
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final PasswordEntryMapper passwordEntryMapper;
    private final PasswordCollectionService passwordCollectionService;
    private final PasswordRecentVisitService passwordRecentVisitService;

    @Override
    public long countPasswords(long userId) {
        return passwordEntryMapper.selectCount(new LambdaQueryWrapper<PasswordEntry>()
                .eq(PasswordEntry::getUserId, userId));
    }

    @Override
    public long countFavorites(long userId) {
        return passwordCollectionService.countFavorites(userId);
    }

    @Override
    public long countRecentVisits(long userId) {
        return passwordRecentVisitService.countRecentVisits(userId);
    }
}
