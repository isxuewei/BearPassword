package com.bear.password.module.version.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.bear.password.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 客户端版本发布记录
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("bp_version")
public class AppVersion extends BaseEntity {

    /** 系统类型，如 MacOS、Windows */
    @TableField("system_info")
    private String systemInfo;

    /** 版本号 */
    private String versionCode;

    /** 下载地址 */
    private String downloadUrl;
}
