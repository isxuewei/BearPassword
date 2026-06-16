package com.bear.password.module.collection.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 密码收藏
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_password_collection")
public class PasswordCollection extends BaseEntity {

    /**
     * 用户 ID
     */
    private Long userId;

    /**
     * 密码条目 ID
     */
    private Long passwordId;
}
