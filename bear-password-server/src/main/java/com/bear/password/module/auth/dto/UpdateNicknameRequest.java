package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 修改昵称请求
 */
@Data
public class UpdateNicknameRequest {

    @NotBlank(message = "昵称不能为空")
    @Size(min = 1, max = 32, message = "昵称长度需在 1-32 位之间")
    private String nickname;
}
