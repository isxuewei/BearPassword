package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SrpLoginInitRequest {

    @NotBlank(message = "请输入用户名或邮箱")
    private String username;
}
