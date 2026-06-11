package com.bear.password.module.password.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 密码库条目
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_password")
public class PasswordEntry extends BaseEntity {

    /** 所属用户 ID */
    private Long userId;

    /** 密码类型：登录信息、服务器、银行卡、身份信息、安全备注、数据库、自定义 */
    private String passwordType;

    /** 标签 JSON，如 ["标签1","标签2"] */
    private String passwordLabels;

    /** 密码标题 */
    private String passwordTitle;

    /** 密码内容 JSON */
    private String content;

    /** 网站地址 JSON，如 ["地址1","地址2"] */
    private String websites;

    /** 备注 */
    private String remark;
}
