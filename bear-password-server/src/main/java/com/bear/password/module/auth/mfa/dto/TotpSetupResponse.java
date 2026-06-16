package com.bear.password.module.auth.mfa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TotpSetupResponse {

    private String pendingToken;
    private String secret;
    private String otpauthUri;
    private String qrCodeBase64;
}
