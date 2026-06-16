package com.bear.password.module.auth.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "passwordChangeToken 不能为空")
    private String passwordChangeToken;

    @Valid
    @NotNull(message = "新 SRP 凭证不能为空")
    private SrpCredentialsSetup srp;
}
