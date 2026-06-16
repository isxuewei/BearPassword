package com.bear.password.module.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SrpLoginVerifyRequest {

    @NotBlank(message = "sessionId 不能为空")
    private String sessionId;

    /**
     * hex，客户端公值 A
     */
    @NotBlank(message = "clientPublicEphemeral 不能为空")
    private String clientPublicEphemeral;

    /**
     * hex，客户端证明 M1
     */
    @NotBlank(message = "clientProof 不能为空")
    private String clientProof;
}
