package com.bear.password.module.password.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bear.password.common.dto.PageResult;
import com.bear.password.module.password.dto.PasswordEntryRequest;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import com.bear.password.module.password.entity.PasswordEntry;

import java.util.List;

/**
 * 密码库服务
 */
public interface PasswordEntryService extends IService<PasswordEntry> {

    PageResult<PasswordEntryResponse> pageEntries(long userId, long page, long pageSize,
                                                  String keyword, String passwordType);

    PasswordEntryResponse getEntry(long userId, Long id);

    PasswordEntryResponse createEntry(long userId, PasswordEntryRequest request);

    PasswordEntryResponse updateEntry(long userId, Long id, PasswordEntryRequest request);

    void deleteEntry(long userId, Long id);

    /**
     * 获取当前用户已使用过的全部标签（去重、排序）
     */
    List<String> listUserLabels(long userId);
}
