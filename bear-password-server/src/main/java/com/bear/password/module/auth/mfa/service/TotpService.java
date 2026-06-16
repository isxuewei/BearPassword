package com.bear.password.module.auth.mfa.service;

import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import com.bear.password.module.auth.mfa.support.MfaSessionData;
import com.bear.password.module.auth.mfa.support.MfaSessionService;
import com.bear.password.module.auth.mfa.support.TotpSecretCodec;
import com.bear.password.module.user.entity.User;
import com.bear.password.module.user.service.UserService;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TotpService {

    private static final String ISSUER = "BearPassword";

    private final TotpSecretCodec totpSecretCodec;
    private final MfaSessionService mfaSessionService;
    private final UserService userService;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(new DefaultCodeGenerator(HashingAlgorithm.SHA1), timeProvider);

    public boolean isEnabled(User user) {
        return user != null && user.getTotpEnabled() != null && user.getTotpEnabled() == 1
                && StringUtils.hasText(user.getTotpSecretEncrypted());
    }

    public TotpSetupResult beginSetup(User user) {
        String secret = secretGenerator.generate();
        String pendingToken = UUID.randomUUID().toString().replace("-", "");
        mfaSessionService.savePendingTotpSecret(pendingToken, secret);

        QrData qrData = new QrData.Builder()
                .label(user.getUsername())
                .secret(secret)
                .issuer(ISSUER)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        String otpauthUri = qrData.getUri();

        return new TotpSetupResult(pendingToken, secret, otpauthUri, generateQrCodeBase64(qrData));
    }

    public void enableTotp(Long userId, String pendingToken, String code) {
        String secret = mfaSessionService.consumePendingTotpSecret(pendingToken);
        verifyCode(secret, code);

        User update = new User();
        update.setId(userId);
        update.setTotpSecretEncrypted(totpSecretCodec.encrypt(secret));
        update.setTotpEnabled(1);
        userService.updateById(update);
    }

    public void disableTotp(Long userId, String code) {
        User user = userService.getById(userId);
        if (user == null || !isEnabled(user)) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "未启用 TOTP");
        }
        verifyCodeForUser(user, code);

        User update = new User();
        update.setId(userId);
        update.setTotpSecretEncrypted(null);
        update.setTotpEnabled(0);
        userService.updateById(update);
    }

    public void verifyLoginCode(MfaSessionData session, String code) {
        User user = userService.getById(session.getUserId());
        if (user == null || !isEnabled(user)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "验证码错误");
        }
        verifyCodeForUser(user, code);
    }

    private void verifyCodeForUser(User user, String code) {
        String secret = totpSecretCodec.decrypt(user.getTotpSecretEncrypted());
        verifyCode(secret, code);
    }

    private void verifyCode(String secret, String code) {
        if (!StringUtils.hasText(code) || !codeVerifier.isValidCode(secret, code.trim())) {
            throw new BusinessException(ResultCode.UNAUTHORIZED.getCode(), "验证码错误或已过期");
        }
    }

    public String generateQrCodeBase64(QrData qrData) {
        try {
            byte[] image = new ZxingPngQrGenerator().generate(qrData);
            return Base64.getEncoder().encodeToString(image);
        } catch (QrGenerationException ex) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "二维码生成失败");
        }
    }

    public record TotpSetupResult(String pendingToken, String secret, String otpauthUri, String qrCodeBase64) {
    }
}
