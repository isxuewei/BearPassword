package com.bear.password.module.recent.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bear.password.common.dto.PageResult;
import com.bear.password.common.dto.PasswordRelationMetaItem;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.password.dto.PasswordEntryResponse;
import com.bear.password.module.password.entity.PasswordEntry;
import com.bear.password.module.password.mapper.PasswordEntryMapper;
import com.bear.password.module.password.service.PasswordEntryService;
import com.bear.password.module.password.support.PasswordEntryResponseMapper;
import com.bear.password.module.recent.entity.PasswordRecentVisit;
import com.bear.password.module.recent.mapper.PasswordRecentVisitMapper;
import com.bear.password.module.recent.service.PasswordRecentVisitService;
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

    private final PasswordEntryService passwordEntryService;
    private final PasswordEntryMapper passwordEntryMapper;
    private final PasswordEntryResponseMapper responseMapper;

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
            entryWrapper.like(PasswordEntry::getContent, keyword);
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
            PasswordEntryResponse response = responseMapper.toResponse(entry);
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
    public List<PasswordRelationMetaItem> listRecentVisitMeta(long userId) {
        return list(new LambdaQueryWrapper<PasswordRecentVisit>()
                .eq(PasswordRecentVisit::getUserId, userId)
                .select(PasswordRecentVisit::getPasswordId, PasswordRecentVisit::getUpdateTime)
                .orderByDesc(PasswordRecentVisit::getUpdateTime))
                .stream()
                .map(visit -> new PasswordRelationMetaItem(
                        visit.getPasswordId(),
                        visit.getUpdateTime()))
                .toList();
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
}
