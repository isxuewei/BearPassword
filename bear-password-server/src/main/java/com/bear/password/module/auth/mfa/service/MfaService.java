package com.bear.password.module.auth.mfa.service;

import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.config.TimeZoneConfig;
import com.bear.password.common.constant.AuthConstants;
import com.bear.password.module.auth.dto.LoginResponse;
import com.bear.password.module.auth.mfa.dto.MfaStatusResponse;
import com.bear.password.module.auth.mfa.dto.TotpSetupResponse;
import com.bear.password.module.auth.mfa.support.MfaSessionData;
import com.bear.password.module.auth.mfa.support.MfaSessionService;
import com.bear.password.module.user.entity.User;
import com.bear.password.module.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MfaService {

    private final TotpService totpService;
    private final MfaSessionService mfaSessionService;
    private final UserService userService;

    public boolean isMfaRequired(User user) {
        return totpService.isEnabled(user);
    }

    public List<String> getAvailableMethods(User user) {
        if (totpService.isEnabled(user)) {
            return List.of("totp");
        }
        return List.of();
    }

    public String createMfaChallenge(User user) {
        return mfaSessionService.createSession(user);
    }

    public MfaStatusResponse getStatus(User user) {
        return new MfaStatusResponse(totpService.isEnabled(user), isMfaRequired(user));
    }

    public TotpSetupResponse beginTotpSetup(User user) {
        TotpService.TotpSetupResult setup = totpService.beginSetup(user);
        return new TotpSetupResponse(
                setup.pendingToken(),
                setup.secret(),
                setup.otpauthUri(),
                setup.qrCodeBase64()
        );
    }

    public void enableTotp(Long userId, String pendingToken, String code) {
        totpService.enableTotp(userId, pendingToken, code);
    }

    public void disableTotp(Long userId, String code) {
        totpService.disableTotp(userId, code);
    }

    public LoginResponse verifyTotpAndLogin(String mfaToken, String code) {
        MfaSessionData session = mfaSessionService.consumeSession(mfaToken);
        totpService.verifyLoginCode(session, code);
        return completeLogin(session);
    }

    public LoginResponse completeLogin(MfaSessionData session) {
        User user = userService.getById(session.getUserId());
        if (user == null) {
            throw new com.bear.password.common.exception.BusinessException(
                    com.bear.password.common.result.ResultCode.UNAUTHORIZED.getCode(),
                    "用户不存在或登录已失效"
            );
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new com.bear.password.common.exception.BusinessException(
                    com.bear.password.common.result.ResultCode.FORBIDDEN.getCode(),
                    "账号已被禁用"
            );
        }

        touchLastLoginTime(user.getId());
        StpUtil.login(user.getId());
        StpUtil.getSession().set(AuthConstants.SESSION_USERNAME, user.getUsername());
        StpUtil.getSession().set(AuthConstants.SESSION_AVATAR, normalizeAvatar(user.getAvatar()));

        return new LoginResponse(
                StpUtil.getTokenValue(),
                user.getUsername(),
                normalizeAvatar(user.getAvatar()),
                null
        );
    }

    private void touchLastLoginTime(Long userId) {
        User update = new User();
        update.setId(userId);
        update.setLastLoginTime(LocalDateTime.now(TimeZoneConfig.APP_ZONE));
        userService.updateById(update);
    }

    private String normalizeAvatar(String avatar) {
        return avatar != null ? avatar : "";
    }
}
