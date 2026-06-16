package com.bear.password.module.password.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bear.password.common.dto.PageResult;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.password.dto.PasswordEntryRequest;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import com.bear.password.module.password.entity.PasswordEntry;
import com.bear.password.module.password.mapper.PasswordEntryMapper;
import com.bear.password.module.password.service.PasswordEntryService;
import com.bear.password.module.password.support.PasswordEntryContentValidator;
import com.bear.password.module.password.support.PasswordEntryResponseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 密码库服务实现
 */
@Service
@RequiredArgsConstructor
public class PasswordEntryServiceImpl extends ServiceImpl<PasswordEntryMapper, PasswordEntry>
        implements PasswordEntryService {

    private final PasswordEntryResponseMapper responseMapper;
    private final PasswordEntryContentValidator contentValidator;

    @Override
    public PageResult<PasswordEntryResponse> pageEntries(long userId, long page, long pageSize,
                                                         String keyword, String passwordType) {
        LambdaQueryWrapper<PasswordEntry> wrapper = new LambdaQueryWrapper<PasswordEntry>()
                .eq(PasswordEntry::getUserId, userId)
                .eq(StringUtils.hasText(passwordType), PasswordEntry::getPasswordType, passwordType)
                .orderByDesc(PasswordEntry::getUpdateTime);

        if (StringUtils.hasText(keyword)) {
            wrapper.like(PasswordEntry::getContent, keyword);
        }

        Page<PasswordEntry> pageResult = page(new Page<>(page, pageSize), wrapper);
        List<PasswordEntryResponse> list = pageResult.getRecords().stream()
                .map(responseMapper::toResponse)
                .toList();

        return new PageResult<>(list, pageResult.getTotal(), page, pageSize);
    }

    @Override
    public PasswordEntryResponse getEntry(long userId, Long id) {
        PasswordEntry entry = getOwnedEntry(userId, id);
        return responseMapper.toResponse(entry);
    }

    @Override
    public PasswordEntryResponse createEntry(long userId, PasswordEntryRequest request) {
        PasswordEntry entry = new PasswordEntry();
        entry.setUserId(userId);
        applyRequest(entry, request);
        save(entry);
        return responseMapper.toResponse(entry);
    }

    @Override
    public PasswordEntryResponse updateEntry(long userId, Long id, PasswordEntryRequest request) {
        PasswordEntry entry = getOwnedEntry(userId, id);
        applyRequest(entry, request);
        updateById(entry);
        return responseMapper.toResponse(entry);
    }

    @Override
    public void deleteEntry(long userId, Long id) {
        PasswordEntry entry = getOwnedEntry(userId, id);
        removeById(entry.getId());
    }

    @Override
    public List<String> listUserLabels(long userId) {
        List<PasswordEntry> entries = list(new LambdaQueryWrapper<PasswordEntry>()
                .eq(PasswordEntry::getUserId, userId)
                .select(PasswordEntry::getContent));
        return responseMapper.collectUserLabels(entries);
    }

    private PasswordEntry getOwnedEntry(long userId, Long id) {
        PasswordEntry entry = getOne(new LambdaQueryWrapper<PasswordEntry>()
                .eq(PasswordEntry::getId, id)
                .eq(PasswordEntry::getUserId, userId));
        if (entry == null) {
            throw new BusinessException(ResultCode.NOT_FOUND.getCode(), "密码条目不存在");
        }
        return entry;
    }

    private void applyRequest(PasswordEntry entry, PasswordEntryRequest request) {
        contentValidator.requireEncryptedContent(request.getContent());
        entry.setPasswordType(request.getPasswordType());
        entry.setContent(responseMapper.toJson(request.getContent()));
    }
}
