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
}
