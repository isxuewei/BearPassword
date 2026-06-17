package com.bear.password.module.password.entity;

import com.baomidou.mybatisplus.annotation.FieldFill;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 密码库条目
 */
@Data
@TableName("bp_password")
public class PasswordEntry {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;

    @TableLogic
    private Integer deleted;

    /**
     * 所属用户 ID
     */
    private Long userId;

    /**
     * 密码类型：登录信息、服务器、银行卡、身份信息、安全备注、数据库、自定义
     */
    private String passwordType;

    /**
     * 密码内容 JSON（含 title、passwordLabels、websites、remark 等元数据）
     */
    private String content;
}
