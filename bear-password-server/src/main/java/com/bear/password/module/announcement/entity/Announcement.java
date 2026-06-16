package com.bear.password.module.announcement.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 公告实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_announcement")
public class Announcement extends BaseEntity {

    /**
     * 标题
     */
    private String title;

    /**
     * 公告内容（Markdown）
     */
    private String content;
}
