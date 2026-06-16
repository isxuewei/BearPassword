package com.bear.password.module.auth.service;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 邮箱验证码用途
 */
@Getter
@RequiredArgsConstructor
public enum VerificationPurpose {

    REGISTER("register:code:", "register:send-lock:");

    private final String codeSegment;
    private final String lockSegment;
}
