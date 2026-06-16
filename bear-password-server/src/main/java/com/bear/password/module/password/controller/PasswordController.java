package com.bear.password.module.password.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.dto.PageResult;
import com.bear.password.common.result.Result;
import com.bear.password.module.password.dto.PasswordEntryRequest;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import com.bear.password.module.password.service.PasswordEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 密码库接口
 */
@RestController
@RequestMapping("/passwords")
@RequiredArgsConstructor
public class PasswordController {

    private final PasswordEntryService passwordEntryService;

    /**
     * 分页查询密码条目
     */
    @GetMapping
    public Result<PageResult<PasswordEntryResponse>> page(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String passwordType) {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordEntryService.pageEntries(userId, page, pageSize, keyword, passwordType));
    }

    /**
     * 获取当前用户已创建过的标签列表
     */
    @GetMapping("/labels")
    public Result<List<String>> labels() {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordEntryService.listUserLabels(userId));
    }

    /**
     * 获取单条密码详情
     */
    @GetMapping("/{id}")
    public Result<PasswordEntryResponse> detail(@PathVariable Long id) {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordEntryService.getEntry(userId, id));
    }

    /**
     * 新增密码条目
     */
    @PostMapping
    public Result<PasswordEntryResponse> create(@Valid @RequestBody PasswordEntryRequest request) {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordEntryService.createEntry(userId, request));
    }

    /**
     * 更新密码条目
     */
    @PutMapping("/{id}")
    public Result<PasswordEntryResponse> update(@PathVariable Long id,
                                                @Valid @RequestBody PasswordEntryRequest request) {
        long userId = StpUtil.getLoginIdAsLong();
        return Result.success(passwordEntryService.updateEntry(userId, id, request));
    }

    /**
     * 删除密码条目
     */
    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        long userId = StpUtil.getLoginIdAsLong();
        passwordEntryService.deleteEntry(userId, id);
        return Result.success();
    }
}
