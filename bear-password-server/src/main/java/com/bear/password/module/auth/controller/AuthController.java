package com.bear.password.module.auth.controller;

import cn.dev33.satoken.annotation.SaIgnore;
import com.bear.password.common.result.Result;
import com.bear.password.module.auth.dto.*;
import com.bear.password.module.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 认证接口
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * SRP 登录第一步：获取 salt 与服务端公值 B
     */
    @SaIgnore
    @PostMapping("/login/init")
    public Result<SrpLoginInitResponse> srpLoginInit(@Valid @RequestBody SrpLoginInitRequest request) {
        return Result.success(authService.srpLoginInit(request));
    }

    /**
     * SRP 登录第二步：提交客户端证明并获取 token
     */
    @SaIgnore
    @PostMapping("/login/verify")
    public Result<SrpLoginVerifyResponse> srpLoginVerify(@Valid @RequestBody SrpLoginVerifyRequest request) {
        return Result.success(authService.srpLoginVerify(request));
    }

    /**
     * 发送注册验证码
     */
    @SaIgnore
    @PostMapping("/register/code")
    public Result<Void> sendRegisterCode(@Valid @RequestBody SendRegisterCodeRequest request) {
        authService.sendRegisterCode(request);
        return Result.success();
    }

    /**
     * 邮箱验证码注册（成功后自动登录）
     */
    @SaIgnore
    @PostMapping("/register")
    public Result<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        return Result.success(authService.register(request));
    }

    /**
     * 退出登录
     */
    @SaIgnore
    @PostMapping("/logout")
    public Result<Void> logout() {
        authService.logout();
        return Result.success();
    }

    /**
     * 获取当前登录用户信息
     */
    @GetMapping("/me")
    public Result<UserInfoResponse> currentUser() {
        return Result.success(authService.currentUser());
    }

    /**
     * 获取当前用户保险库加密元数据
     */
    @GetMapping("/vault-crypto")
    public Result<VaultCryptoResponse> vaultCrypto() {
        return Result.success(authService.getVaultCrypto());
    }

    /**
     * 修改登录密码：先 POST /auth/password/srp/init + /verify 获取 passwordChangeToken
     */
    @PutMapping("/password")
    public Result<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
        return Result.success();
    }

    /**
     * 修改密码：SRP 验证当前密码（第一步）
     */
    @PostMapping("/password/srp/init")
    public Result<SrpLoginInitResponse> srpPasswordInit() {
        return Result.success(authService.srpPasswordInit());
    }

    /**
     * 修改密码：SRP 验证当前密码（第二步）
     */
    @PostMapping("/password/srp/verify")
    public Result<SrpLoginVerifyResponse> srpPasswordVerify(@Valid @RequestBody SrpLoginVerifyRequest request) {
        return Result.success(authService.srpLoginVerify(request));
    }

    /**
     * 发送更换安全密钥邮箱验证码
     */
    @PostMapping("/security-key/code")
    public Result<SecurityKeyChangeCodeResponse> sendSecurityKeyChangeCode() {
        return Result.success(authService.sendSecurityKeyChangeCode());
    }

    /**
     * 校验更换安全密钥邮箱验证码
     */
    @PostMapping("/security-key/verify")
    public Result<Void> verifySecurityKeyChangeCode(
            @Valid @RequestBody VerifySecurityKeyChangeCodeRequest request
    ) {
        authService.verifySecurityKeyChangeCode(request);
        return Result.success();
    }

    /**
     * 校验用户名是否可用（排除当前用户）
     */
    @GetMapping("/username/check")
    public Result<UsernameCheckResponse> checkUsername(@RequestParam String username) {
        return Result.success(authService.checkUsername(username));
    }

    /**
     * 修改当前用户名
     */
    @PutMapping("/username")
    public Result<Void> updateUsername(@Valid @RequestBody UpdateUsernameRequest request) {
        authService.updateUsername(request);
        return Result.success();
    }

    /**
     * 修改当前用户昵称
     */
    @PutMapping("/nickname")
    public Result<Void> updateNickname(@Valid @RequestBody UpdateNicknameRequest request) {
        authService.updateNickname(request);
        return Result.success();
    }

    /**
     * 上传并更新当前用户头像
     */
    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<AvatarUploadResponse> uploadAvatar(@RequestPart("file") MultipartFile file) {
        return Result.success(authService.uploadAvatar(file));
    }
}
