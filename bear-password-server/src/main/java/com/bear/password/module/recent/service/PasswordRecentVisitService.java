package com.bear.password.module.recent.service;

import com.bear.password.common.dto.PageResult;
import com.bear.password.module.password.dto.PasswordEntryResponse;

/**
 * 密码最近访问服务
 */
public interface PasswordRecentVisitService {

    /** 分页查询最近访问条目 */
    PageResult<PasswordEntryResponse> pageRecentVisits(long userId, long page, long pageSize, String keyword);

    /** 记录一次访问（同一密码重复访问会更新时间并置顶，最多保留 30 条） */
    void recordVisit(long userId, Long passwordId);

    /** 统计最近访问数量 */
    long countRecentVisits(long userId);
}
