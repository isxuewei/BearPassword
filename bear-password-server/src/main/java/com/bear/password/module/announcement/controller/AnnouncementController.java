package com.bear.password.module.announcement.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.result.Result;
import com.bear.password.module.announcement.dto.AnnouncementResponse;
import com.bear.password.module.announcement.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 公告接口
 */
@RestController
@RequestMapping("/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    /**
     * 获取当前用户待确认的最新公告
     */
    @GetMapping("/pending")
    public Result<AnnouncementResponse> pending() {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(announcementService.getPendingForUser(userId));
    }

    /**
     * 确认公告
     */
    @PostMapping("/{id}/confirm")
    public Result<Void> confirm(@PathVariable Long id) {
        long userId = StpUtil.getLoginIdAsLong();
        announcementService.confirm(userId, id);
        return Result.success();
    }
}
