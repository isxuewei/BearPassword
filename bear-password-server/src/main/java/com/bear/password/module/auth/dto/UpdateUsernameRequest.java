package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 修改用户名请求
 */
@Data
public class UpdateUsernameRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 32, message = "用户名长度需在 2-32 位之间")
    @Pattern(regexp = "^[\\u4e00-\\u9fff\\w]+$", message = "用户名仅支持中文、字母、数字和下划线")
    private String username;
}
