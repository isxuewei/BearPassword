package com.bear.password.module.announcement.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.announcement.dto.AnnouncementResponse;
import com.bear.password.module.announcement.entity.Announcement;
import com.bear.password.module.announcement.entity.AnnouncementConfirm;
import com.bear.password.module.announcement.mapper.AnnouncementConfirmMapper;
import com.bear.password.module.announcement.mapper.AnnouncementMapper;
import com.bear.password.module.announcement.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 公告服务实现
 */
@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl extends ServiceImpl<AnnouncementMapper, Announcement>
        implements AnnouncementService {

    private final AnnouncementConfirmMapper announcementConfirmMapper;

    @Override
    public AnnouncementResponse getPendingForUser(long userId) {
        Announcement latest = lambdaQuery()
                .orderByDesc(Announcement::getId)
                .last("LIMIT 1")
                .one();
        if (latest == null) {
            return null;
        }

        boolean confirmed = announcementConfirmMapper.exists(new LambdaQueryWrapper<AnnouncementConfirm>()
                .eq(AnnouncementConfirm::getAnnouncementId, latest.getId())
                .eq(AnnouncementConfirm::getUserId, userId));
        if (confirmed) {
            return null;
        }

        return toResponse(latest);
    }

    @Override
    public void confirm(long userId, long announcementId) {
        Announcement announcement = getById(announcementId);
        if (announcement == null) {
            throw new BusinessException(ResultCode.NOT_FOUND);
        }

        boolean exists = announcementConfirmMapper.exists(new LambdaQueryWrapper<AnnouncementConfirm>()
                .eq(AnnouncementConfirm::getAnnouncementId, announcementId)
                .eq(AnnouncementConfirm::getUserId, userId));
        if (exists) {
            return;
        }

        AnnouncementConfirm record = new AnnouncementConfirm();
        record.setAnnouncementId(announcementId);
        record.setUserId(userId);
        announcementConfirmMapper.insert(record);
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        AnnouncementResponse response = new AnnouncementResponse();
        response.setId(announcement.getId());
        response.setTitle(announcement.getTitle());
        response.setContent(announcement.getContent());
        response.setCreateTime(announcement.getCreateTime());
        return response;
    }
}
