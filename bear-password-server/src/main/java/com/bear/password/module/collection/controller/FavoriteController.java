package com.bear.password.module.collection.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.dto.PageResult;
import com.bear.password.common.result.Result;
import com.bear.password.module.collection.service.PasswordCollectionService;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 收藏夹接口
 */
@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final PasswordCollectionService passwordCollectionService;

    /**
     * 分页查询收藏条目
     */
    @GetMapping
    public Result<PageResult<PasswordEntryResponse>> page(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword) {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordCollectionService.pageFavorites(userId, page, pageSize, keyword));
    }

    /**
     * 当前用户已收藏的密码 ID 列表
     */
    @GetMapping("/ids")
    public Result<List<Long>> ids() {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordCollectionService.listFavoritePasswordIds(userId));
    }

    /**
     * 添加收藏
     */
    @PostMapping("/{passwordId}")
    public Result<Void> add(@PathVariable Long passwordId) {
        long userId = StpUtil.getLoginIdAsLong();
        passwordCollectionService.addFavorite(userId, passwordId);
        return Result.success();
    }

    /**
     * 取消收藏
     */
    @DeleteMapping("/{passwordId}")
    public Result<Void> remove(@PathVariable Long passwordId) {
        long userId = StpUtil.getLoginIdAsLong();
        passwordCollectionService.removeFavorite(userId, passwordId);
        return Result.success();
    }
}
