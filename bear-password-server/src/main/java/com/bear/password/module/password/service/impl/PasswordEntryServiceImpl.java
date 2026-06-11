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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.TreeSet;

/**
 * 密码库服务实现
 */
@Service
@RequiredArgsConstructor
public class PasswordEntryServiceImpl extends ServiceImpl<PasswordEntryMapper, PasswordEntry>
        implements PasswordEntryService {

    private static final TypeReference<List<String>> LABEL_TYPE = new TypeReference<>() {};
    private static final TypeReference<Map<String, Object>> CONTENT_TYPE = new TypeReference<>() {};

    private final ObjectMapper objectMapper;

    @Override
    public PageResult<PasswordEntryResponse> pageEntries(long userId, long page, long pageSize,
                                                          String keyword, String passwordType) {
        LambdaQueryWrapper<PasswordEntry> wrapper = new LambdaQueryWrapper<PasswordEntry>()
                .eq(PasswordEntry::getUserId, userId)
                .eq(StringUtils.hasText(passwordType), PasswordEntry::getPasswordType, passwordType)
                .orderByDesc(PasswordEntry::getUpdateTime);

        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like(PasswordEntry::getPasswordTitle, keyword)
                    .or().like(PasswordEntry::getPasswordLabels, keyword)
                    .or().like(PasswordEntry::getWebsites, keyword)
                    .or().like(PasswordEntry::getRemark, keyword));
        }

        Page<PasswordEntry> pageResult = page(new Page<>(page, pageSize), wrapper);
        List<PasswordEntryResponse> list = pageResult.getRecords().stream()
                .map(this::toResponse)
                .toList();

        return new PageResult<>(list, pageResult.getTotal(), page, pageSize);
    }

    @Override
    public PasswordEntryResponse getEntry(long userId, Long id) {
        PasswordEntry entry = getOwnedEntry(userId, id);
        return toResponse(entry);
    }

    @Override
    public PasswordEntryResponse createEntry(long userId, PasswordEntryRequest request) {
        PasswordEntry entry = new PasswordEntry();
        entry.setUserId(userId);
        applyRequest(entry, request);
        save(entry);
        return toResponse(entry);
    }

    @Override
    public PasswordEntryResponse updateEntry(long userId, Long id, PasswordEntryRequest request) {
        PasswordEntry entry = getOwnedEntry(userId, id);
        applyRequest(entry, request);
        updateById(entry);
        return toResponse(entry);
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
                .select(PasswordEntry::getPasswordLabels));

        TreeSet<String> labels = new TreeSet<>();
        for (PasswordEntry entry : entries) {
            List<String> entryLabels = fromJson(entry.getPasswordLabels(), LABEL_TYPE);
            if (entryLabels == null) {
                continue;
            }
            entryLabels.stream()
                    .filter(StringUtils::hasText)
                    .map(String::trim)
                    .forEach(labels::add);
        }
        return labels.stream().toList();
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
        entry.setPasswordType(request.getPasswordType());
        entry.setPasswordLabels(toJson(request.getPasswordLabels()));
        entry.setPasswordTitle(StringUtils.hasText(request.getPasswordTitle()) ? request.getPasswordTitle().trim() : "");
        entry.setContent(toJson(request.getContent()));
        entry.setWebsites(toJson(request.getWebsites() != null ? request.getWebsites() : List.of()));
        entry.setRemark(StringUtils.hasText(request.getRemark()) ? request.getRemark() : "");
    }

    private PasswordEntryResponse toResponse(PasswordEntry entry) {
        PasswordEntryResponse response = new PasswordEntryResponse();
        response.setId(entry.getId());
        response.setPasswordType(entry.getPasswordType());
        response.setPasswordLabels(fromJson(entry.getPasswordLabels(), LABEL_TYPE));
        response.setPasswordTitle(entry.getPasswordTitle());
        response.setContent(fromJson(entry.getContent(), CONTENT_TYPE));
        response.setWebsites(fromJson(entry.getWebsites(), LABEL_TYPE));
        response.setRemark(entry.getRemark());
        response.setCreateTime(entry.getCreateTime());
        response.setUpdateTime(entry.getUpdateTime());
        return response;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "JSON 格式错误");
        }
    }

    private <T> T fromJson(String json, TypeReference<T> typeReference) {
        if (!StringUtils.hasText(json)) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "数据解析失败");
        }
    }
}
