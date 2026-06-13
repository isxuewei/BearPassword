package com.bear.password.module.announcement.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 待展示公告
 */
@Data
public class AnnouncementResponse {

    private Long id;

    private String title;

    /** Markdown 原文 */
    private String content;

    private LocalDateTime createTime;
}
