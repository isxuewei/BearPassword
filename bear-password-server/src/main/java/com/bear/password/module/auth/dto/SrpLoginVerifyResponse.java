package com.bear.password.module.auth.dto;

import lombok.Data;

@Data
public class SrpLoginVerifyResponse {

    /**
     * hex，服务端证明 M2
     */
    private String serverProof;

    private String token;
    private String username;
    private String nickname;
    private String avatar;

    /**
     * 改密流程专用：短期凭证
     */
    private String passwordChangeToken;

    /**
     * 是否需要二次验证
     */
    private Boolean mfaRequired;

    /**
     * 二次验证临时 token
     */
    private String mfaToken;

    /**
     * 可用的二次验证方式：totp
     */
    private java.util.List<String> mfaMethods;
}
