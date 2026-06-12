package com.bear.password.module.user.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 用户实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_user")
public class User extends BaseEntity {

    /** 用户名 */
    private String username;

    /** 密码（BCrypt 加密存储） */
    private String password;

    /** 昵称 */
    private String nickname;

    /** 头像 URL */
    private String avatar;

    /** 邮箱地址 */
    private String email;

    /** 状态：0-禁用 1-正常 */
    private Integer status;

    /** 上次登录时间 */
    private LocalDateTime lastLoginTime;
}
