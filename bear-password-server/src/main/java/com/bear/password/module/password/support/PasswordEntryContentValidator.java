package com.bear.password.module.password.support;

import com.bear.password.common.exception.BusinessException;
import com.bear.password.common.result.ResultCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * 校验密码 content 必须为客户端加密后的 envelope
 */
@Component
public class PasswordEntryContentValidator {

    private static final String ENCRYPTED_MARKER = "__encrypted__";

    public void requireEncryptedContent(Map<String, Object> content) {
        if (content == null || content.isEmpty()) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "密码内容不能为空");
        }
        if (!Boolean.TRUE.equals(content.get(ENCRYPTED_MARKER))) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "密码内容必须加密后上传");
        }
        Object iv = content.get("iv");
        Object data = content.get("data");
        if (!(iv instanceof String ivText && StringUtils.hasText(ivText))
                || !(data instanceof String dataText && StringUtils.hasText(dataText))) {
            throw new BusinessException(ResultCode.BAD_REQUEST.getCode(), "加密数据格式无效");
        }
    }
}
