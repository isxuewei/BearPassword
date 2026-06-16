package com.bear.password.module.recent.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.dto.PageResult;
import com.bear.password.common.dto.PasswordRelationMetaItem;
import com.bear.password.common.result.Result;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import com.bear.password.module.recent.service.PasswordRecentVisitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 最近访问接口
 */
@RestController
@RequestMapping("/recent-visits")
@RequiredArgsConstructor
public class RecentVisitController {

    private final PasswordRecentVisitService passwordRecentVisitService;

    /**
     * 分页查询最近访问条目
     */
    @GetMapping
    public Result<PageResult<PasswordEntryResponse>> page(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordRecentVisitService.pageRecentVisits(userId, page, pageSize, keyword));
    }

    /**
     * 最近访问元数据（密码 ID + 访问时间，不含 content）
     */
    @GetMapping("/meta")
    public Result<List<PasswordRelationMetaItem>> meta() {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordRecentVisitService.listRecentVisitMeta(userId));
    }

    /**
     * 记录一次访问（点击明细字段复制时调用）
     */
    @PostMapping("/{passwordId}")
    public Result<Void> record(@PathVariable Long passwordId) {
        long userId = StpUtil.getLoginIdAsLong();
        passwordRecentVisitService.recordVisit(userId, passwordId);
        return Result.success();
    }
}
