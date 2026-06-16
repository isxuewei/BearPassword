package com.bear.password.module.auth.mfa.controller;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.Result;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.auth.dto.LoginResponse;
import com.bear.password.module.auth.mfa.dto.MfaStatusResponse;
import com.bear.password.module.auth.mfa.dto.MfaTotpVerifyRequest;
import com.bear.password.module.auth.mfa.dto.TotpCodeRequest;
import com.bear.password.module.auth.mfa.dto.TotpEnableRequest;
import com.bear.password.module.auth.mfa.dto.TotpSetupResponse;
import com.bear.password.module.auth.mfa.service.MfaService;
import com.bear.password.module.user.entity.User;
import com.bear.password.module.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 二次验证：TOTP 2FA
 */
@RestController
@RequestMapping("/auth/mfa")
@RequiredArgsConstructor
public class MfaController {

    private final MfaService mfaService;
    private final UserService userService;

    @GetMapping("/status")
    public Result<MfaStatusResponse> status() {
        return Result.success(mfaService.getStatus(requireCurrentUser()));
    }

    @PostMapping("/totp/setup")
    public Result<TotpSetupResponse> setupTotp() {
        return Result.success(mfaService.beginTotpSetup(requireCurrentUser()));
    }

    @PostMapping("/totp/enable")
    public Result<Void> enableTotp(@Valid @RequestBody TotpEnableRequest request) {
        mfaService.enableTotp(StpUtil.getLoginIdAsLong(), request.getPendingToken(), request.getCode());
        return Result.success();
    }

    @PostMapping("/totp/disable")
    public Result<Void> disableTotp(@Valid @RequestBody TotpCodeRequest request) {
        mfaService.disableTotp(StpUtil.getLoginIdAsLong(), request.getCode());
        return Result.success();
    }

    /** 登录第二步：TOTP 验证 */
    @PostMapping("/totp/verify")
    public Result<LoginResponse> verifyTotpLogin(@Valid @RequestBody MfaTotpVerifyRequest request) {
        return Result.success(mfaService.verifyTotpAndLogin(request.getMfaToken(), request.getCode()));
    }

    private User requireCurrentUser() {
        long userId = StpUtil.getLoginIdAsLong();
        User user = userService.getById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "用户不存在或登录已失效");
        }
        return user;
    }
}
