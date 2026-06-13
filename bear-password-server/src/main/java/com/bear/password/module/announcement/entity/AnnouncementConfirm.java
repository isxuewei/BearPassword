package com.bear.password.module.announcement.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 公告确认记录
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_announcement_confirm")
public class AnnouncementConfirm extends BaseEntity {

    /** 公告 ID */
    private Long announcementId;

    /** 用户 ID */
    private Long userId;
}
