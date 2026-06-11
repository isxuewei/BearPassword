package com.bear.password.module.auth.service;

import com.bear.password.common.config.RegisterProperties;
import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 邮件发送服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final RegisterProperties registerProperties;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    public void sendRegisterCode(String toEmail, String code) {
        if (!StringUtils.hasText(mailFrom)) {
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "邮件服务未配置，请联系管理员");
        }

        int expireMinutes = registerProperties.getRegister().getCodeExpireMinutes();
        String fromName = registerProperties.getMail().getFromName();

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(String.format("%s <%s>", fromName, mailFrom));
        message.setTo(toEmail);
        message.setSubject("BearPassword 注册验证码");
        message.setText(String.format(
                "您好，\n\n您正在注册 BearPassword 账户，验证码为：%s\n\n验证码 %d 分钟内有效，请勿泄露给他人。\n\n如非本人操作，请忽略此邮件。",
                code,
                expireMinutes
        ));

        try {
            mailSender.send(message);
        } catch (Exception ex) {
            log.error("发送注册验证码失败 to={}", toEmail, ex);
            throw new BusinessException(ResultCode.INTERNAL_ERROR.getCode(), "验证码发送失败，请稍后重试");
        }
    }
}
