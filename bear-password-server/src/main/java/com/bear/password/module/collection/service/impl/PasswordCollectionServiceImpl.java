package com.bear.password.module.collection.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bear.password.common.dto.PageResult;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.collection.entity.PasswordCollection;
import com.bear.password.module.collection.mapper.PasswordCollectionMapper;
import com.bear.password.module.collection.service.PasswordCollectionService;
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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 密码收藏服务实现
 */
@Service
@RequiredArgsConstructor
public class PasswordCollectionServiceImpl extends ServiceImpl<PasswordCollectionMapper, PasswordCollection>
        implements PasswordCollectionService {

    private static final TypeReference<List<String>> LABEL_TYPE = new TypeReference<>() {};
    private static final TypeReference<Map<String, Object>> CONTENT_TYPE = new TypeReference<>() {};

    private final PasswordEntryService passwordEntryService;
    private final PasswordEntryMapper passwordEntryMapper;
    private final ObjectMapper objectMapper;

    @Override
    public PageResult<PasswordEntryResponse> pageFavorites(long userId, long page, long pageSize, String keyword) {
        LambdaQueryWrapper<PasswordCollection> collectionWrapper = new LambdaQueryWrapper<PasswordCollection>()
                .eq(PasswordCollection::getUserId, userId)
                .orderByDesc(PasswordCollection::getCreateTime);

        Page<PasswordCollection> collectionPage = page(new Page<>(page, pageSize), collectionWrapper);
        if (collectionPage.getRecords().isEmpty()) {
            return new PageResult<>(List.of(), collectionPage.getTotal(), page, pageSize);
        }

        List<Long> passwordIds = collectionPage.getRecords().stream()
                .map(PasswordCollection::getPasswordId)
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
        for (PasswordCollection collection : collectionPage.getRecords()) {
            PasswordEntry entry = entryMap.get(collection.getPasswordId());
            if (entry == null) {
                continue;
            }
            PasswordEntryResponse response = toResponse(entry);
            response.setFavorite(true);
            response.setFavoriteTime(collection.getCreateTime());
            list.add(response);
        }

        long total = StringUtils.hasText(keyword) ? list.size() : collectionPage.getTotal();
        return new PageResult<>(list, total, page, pageSize);
    }

    @Override
    public void addFavorite(long userId, Long passwordId) {
        passwordEntryService.getEntry(userId, passwordId);

        PasswordCollection existing = baseMapper.selectByUserAndPassword(userId, passwordId);
        if (existing != null && Objects.equals(existing.getDeleted(), 0)) {
            return;
        }
        if (existing != null) {
            int restored = baseMapper.restoreById(existing.getId());
            if (restored == 0) {
                throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "收藏恢复失败");
            }
            return;
        }

        PasswordCollection collection = new PasswordCollection();
        collection.setUserId(userId);
        collection.setPasswordId(passwordId);
        save(collection);
    }

    @Override
    public void removeFavorite(long userId, Long passwordId) {
        passwordEntryService.getEntry(userId, passwordId);

        PasswordCollection collection = baseMapper.selectByUserAndPassword(userId, passwordId);
        if (collection == null || Objects.equals(collection.getDeleted(), 1)) {
            return;
        }
        removeById(collection.getId());
    }

    @Override
    public List<Long> listFavoritePasswordIds(long userId) {
        return list(new LambdaQueryWrapper<PasswordCollection>()
                .eq(PasswordCollection::getUserId, userId)
                .select(PasswordCollection::getPasswordId)
                .orderByDesc(PasswordCollection::getCreateTime))
                .stream()
                .map(PasswordCollection::getPasswordId)
                .toList();
    }

    @Override
    public long countFavorites(long userId) {
        return count(new LambdaQueryWrapper<PasswordCollection>()
                .eq(PasswordCollection::getUserId, userId));
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
