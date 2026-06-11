package com.bear.password.module.recent.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bear.password.common.dto.PageResult;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import com.bear.password.module.password.entity.PasswordEntry;
import com.bear.password.module.password.mapper.PasswordEntryMapper;
import com.bear.password.module.password.service.PasswordEntryService;
import com.bear.password.module.recent.entity.PasswordRecentVisit;
import com.bear.password.module.recent.mapper.PasswordRecentVisitMapper;
import com.bear.password.module.recent.service.PasswordRecentVisitService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 密码最近访问服务实现
 */
@Service
@RequiredArgsConstructor
public class PasswordRecentVisitServiceImpl extends ServiceImpl<PasswordRecentVisitMapper, PasswordRecentVisit>
        implements PasswordRecentVisitService {

    private static final int MAX_RECENT_VISITS = 30;
    private static final TypeReference<List<String>> LABEL_TYPE = new TypeReference<>() {};
    private static final TypeReference<Map<String, Object>> CONTENT_TYPE = new TypeReference<>() {};

    private final PasswordEntryService passwordEntryService;
    private final PasswordEntryMapper passwordEntryMapper;
    private final ObjectMapper objectMapper;

    @Override
    public PageResult<PasswordEntryResponse> pageRecentVisits(long userId, long page, long pageSize, String keyword) {
        LambdaQueryWrapper<PasswordRecentVisit> visitWrapper = new LambdaQueryWrapper<PasswordRecentVisit>()
                .eq(PasswordRecentVisit::getUserId, userId)
                .orderByDesc(PasswordRecentVisit::getUpdateTime);

        Page<PasswordRecentVisit> visitPage = page(new Page<>(page, pageSize), visitWrapper);
        if (visitPage.getRecords().isEmpty()) {
            return new PageResult<>(List.of(), visitPage.getTotal(), page, pageSize);
        }

        List<Long> passwordIds = visitPage.getRecords().stream()
                .map(PasswordRecentVisit::getPasswordId)
                .toList();

        LambdaQueryWrapper<PasswordEntry> entryWrapper = new LambdaQueryWrapper<PasswordEntry>()
                .eq(PasswordEntry::getUserId, userId)
                .in(PasswordEntry::getId, passwordIds);

        if (StringUtils.hasText(keyword)) {
            entryWrapper.and(w -> w.like(PasswordEntry::getPasswordTitle, keyword)
                    .or().like(PasswordEntry::getPasswordLabels, keyword)
                    .or().like(PasswordEntry::getWebsites, keyword)
                    .or().like(PasswordEntry::getRemark, keyword)
                    .or().like(PasswordEntry::getContent, keyword));
        }

        List<PasswordEntry> entries = passwordEntryMapper.selectList(entryWrapper);
        Map<Long, PasswordEntry> entryMap = new HashMap<>();
        for (PasswordEntry entry : entries) {
            entryMap.put(entry.getId(), entry);
        }

        List<PasswordEntryResponse> list = new ArrayList<>();
        for (PasswordRecentVisit visit : visitPage.getRecords()) {
            PasswordEntry entry = entryMap.get(visit.getPasswordId());
            if (entry == null) {
                continue;
            }
            PasswordEntryResponse response = toResponse(entry);
            response.setRecentVisitTime(visit.getUpdateTime());
            list.add(response);
        }

        long total = StringUtils.hasText(keyword) ? list.size() : visitPage.getTotal();
        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public void recordVisit(long userId, Long passwordId) {
        passwordEntryService.getEntry(userId, passwordId);

        PasswordRecentVisit existing = baseMapper.selectByUserAndPassword(userId, passwordId);
        if (existing != null && Objects.equals(existing.getDeleted(), 0)) {
            PasswordRecentVisit touch = new PasswordRecentVisit();
            touch.setId(existing.getId());
            updateById(touch);
            trimRecentVisits(userId);
            return;
        }
        if (existing != null) {
            int restored = baseMapper.restoreById(existing.getId());
            if (restored == 0) {
                throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "访问记录恢复失败");
            }
            trimRecentVisits(userId);
            return;
        }

        PasswordRecentVisit visit = new PasswordRecentVisit();
        visit.setUserId(userId);
        visit.setPasswordId(passwordId);
        save(visit);
        trimRecentVisits(userId);
    }

    @Override
    public long countRecentVisits(long userId) {
        return count(new LambdaQueryWrapper<PasswordRecentVisit>()
                .eq(PasswordRecentVisit::getUserId, userId));
    }

    private void trimRecentVisits(long userId) {
        List<PasswordRecentVisit> visits = list(new LambdaQueryWrapper<PasswordRecentVisit>()
                .eq(PasswordRecentVisit::getUserId, userId)
                .orderByDesc(PasswordRecentVisit::getUpdateTime)
                .select(PasswordRecentVisit::getId));
        if (visits.size() <= MAX_RECENT_VISITS) {
            return;
        }
        for (int i = MAX_RECENT_VISITS; i < visits.size(); i++) {
            removeById(visits.get(i).getId());
        }
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
