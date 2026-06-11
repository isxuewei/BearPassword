package com.bear.password.module.dashboard.service;

/**
 * 仪表盘统计服务
 */
public interface DashboardService {

    long countPasswords(long userId);

    long countFavorites(long userId);

    long countRecentVisits(long userId);
}
