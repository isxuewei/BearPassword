package com.bear.password.module.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 仪表盘统计响应 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    private Long totalPasswords;
    private Long favoriteCount;
    private Long recentCount;
}
