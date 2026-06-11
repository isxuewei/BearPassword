package com.bear.password.module.recent.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 密码最近访问
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_password_recent_visit")
public class PasswordRecentVisit extends BaseEntity {

    /** 用户 ID */
    private Long userId;

    /** 密码条目 ID */
    private Long passwordId;
}
