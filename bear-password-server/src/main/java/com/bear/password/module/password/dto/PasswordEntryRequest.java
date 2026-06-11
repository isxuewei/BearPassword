package com.bear.password.module.password.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 创建 / 更新密码条目请求
 */
@Data
public class PasswordEntryRequest {

    @NotBlank(message = "密码类型不能为空")
    private String passwordType;

    @NotNull(message = "标签不能为空")
    private List<String> passwordLabels;

    private String passwordTitle;

    @NotNull(message = "密码内容不能为空")
    private Map<String, Object> content;

    private List<String> websites;

    private String remark;
}
