package com.bear.password.module.announcement.service;

import com.bear.password.module.announcement.dto.AnnouncementResponse;

/**
 * 公告服务
 */
public interface AnnouncementService {

    /**
     * 获取当前用户尚未确认的最新公告；若已全部确认则返回 null
     */
    AnnouncementResponse getPendingForUser(long userId);

    /**
     * 确认公告（幂等）
     */
    void confirm(long userId, long announcementId);
}
