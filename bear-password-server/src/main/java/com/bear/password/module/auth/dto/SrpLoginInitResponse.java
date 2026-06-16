package com.bear.password.module.auth.dto;

import lombok.Data;

@Data
public class SrpLoginInitResponse {

    private String sessionId;

    /**
     * SRP 身份标识（username）
     */
    private String identity;

    /**
     * hex
     */
    private String salt;

    /**
     * hex，服务端公值 B
     */
    private String serverPublicEphemeral;
}
