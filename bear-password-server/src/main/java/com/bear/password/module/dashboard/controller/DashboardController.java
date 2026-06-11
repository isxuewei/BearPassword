package com.bear.password.module.dashboard.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.result.Result;
import com.bear.password.module.dashboard.dto.DashboardStatsResponse;
import com.bear.password.module.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 仪表盘接口
 */
@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public Result<DashboardStatsResponse> stats() {
        long userId = StpUtil.getLoginIdAsLong();
        long totalPasswords = dashboardService.countPasswords(userId);
        long favoriteCount = dashboardService.countFavorites(userId);
        long recentCount = dashboardService.countRecentVisits(userId);
        DashboardStatsResponse data = new DashboardStatsResponse(totalPasswords, favoriteCount, recentCount);
        return Result.success(data);
    }
}
