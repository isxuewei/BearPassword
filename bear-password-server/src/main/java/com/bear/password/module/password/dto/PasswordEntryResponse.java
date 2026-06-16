package com.bear.password.module.password.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 密码条目响应
 */
@Data
public class PasswordEntryResponse {

    private Long id;
    private String passwordType;
    private Map<String, Object> content;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    /**
     * 是否已收藏（列表/详情可选返回）
     */
    private Boolean favorite;
    /**
     * 收藏时间
     */
    private LocalDateTime favoriteTime;
    /**
     * 最近访问时间
     */
    private LocalDateTime recentVisitTime;
}
