package com.bear.password.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 密码条目关联元数据（收藏时间、最近访问时间等，不含 content）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PasswordRelationMetaItem {

    private Long passwordId;

    private LocalDateTime time;
}
