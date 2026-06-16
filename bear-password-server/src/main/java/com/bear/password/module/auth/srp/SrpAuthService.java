package com.bear.password.module.auth.srp;

import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.auth.dto.SrpCredentialsSetup;
import com.bear.password.module.user.entity.User;
import com.nimbusds.srp6.SRP6Exception;
import com.nimbusds.srp6.SRP6ServerSession;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigInteger;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SrpAuthService {

    private final SrpSessionService srpSessionService;

    public void validateCredentialsSetup(SrpCredentialsSetup setup) {
        if (setup == null || !StringUtils.hasText(setup.getSalt()) || !StringUtils.hasText(setup.getVerifier())) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "SRP 凭证不完整");
        }
        parseStoredBigInteger(setup.getSalt());
        parseStoredBigInteger(setup.getVerifier());
    }

    public SrpLoginStartResult startLogin(User user, boolean passwordChange) {
        BigInteger salt = requireSalt(user);
        BigInteger verifier = requireVerifier(user);
        String identity = user.getUsername();

        SRP6ServerSession serverSession = new SRP6ServerSession(SrpConstants.CRYPTO_PARAMS, SrpConstants.SESSION_TTL_SECONDS);
        BigInteger serverPublicEphemeral;
        try {
            serverPublicEphemeral = serverSession.step1(identity, salt, verifier);
        } catch (IllegalStateException ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "SRP 登录初始化失败");
        }

        String sessionId = srpSessionService.createSessionId();
        srpSessionService.saveLoginSession(
                sessionId,
                new SrpLoginSessionData(user.getId(), identity, serverSession, passwordChange)
        );

        SrpLoginStartResult result = new SrpLoginStartResult();
        result.setSessionId(sessionId);
        result.setIdentity(identity);
        result.setSalt(SrpEncoding.toHex(salt));
        result.setServerPublicEphemeral(SrpEncoding.toHex(serverPublicEphemeral));
        return result;
    }

    public SrpLoginVerifyResult verifyLogin(String sessionId, BigInteger clientPublicEphemeral, BigInteger clientProof) {
        SrpLoginSessionData sessionData = srpSessionService.peekLoginSession(sessionId);
        SRP6ServerSession serverSession = sessionData.getServerSession();
        try {
            BigInteger serverProof = serverSession.step2(clientPublicEphemeral, clientProof);
            srpSessionService.deleteLoginSession(sessionId);

            SrpLoginVerifyResult result = new SrpLoginVerifyResult();
            result.setUserId(sessionData.getUserId());
            result.setServerProof(SrpEncoding.toHex(serverProof));
            result.setPasswordChange(sessionData.isPasswordChange());
            return result;
        } catch (SRP6Exception ex) {
            srpSessionService.deleteLoginSession(sessionId);
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "账号或密码错误");
        }
    }

    public String issuePasswordChangeToken(Long userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        srpSessionService.savePasswordChangeToken(token, userId);
        return token;
    }

    public Long consumePasswordChangeToken(String token) {
        return srpSessionService.consumePasswordChangeToken(token);
    }

    public void applyCredentials(User user, SrpCredentialsSetup setup) {
        validateCredentialsSetup(setup);
        user.setSrpSalt(setup.getSalt().trim());
        user.setSrpVerifier(setup.getVerifier().trim());
    }

    public boolean hasSrpCredentials(User user) {
        return StringUtils.hasText(user.getSrpSalt()) && StringUtils.hasText(user.getSrpVerifier());
    }

    public BigInteger requireSalt(User user) {
        return parseStoredBigInteger(user.getSrpSalt());
    }

    public BigInteger requireVerifier(User user) {
        return parseStoredBigInteger(user.getSrpVerifier());
    }

    private BigInteger parseStoredBigInteger(String value) {
        if (!StringUtils.hasText(value)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "账户未配置 SRP 凭证");
        }
        return SrpEncoding.parseHex(value);
    }

    @lombok.Data
    public static class SrpLoginStartResult {
        private String sessionId;
        private String identity;
        private String salt;
        private String serverPublicEphemeral;
    }

    @lombok.Data
    public static class SrpLoginVerifyResult {
        private Long userId;
        private String serverProof;
        private boolean passwordChange;
    }
}
