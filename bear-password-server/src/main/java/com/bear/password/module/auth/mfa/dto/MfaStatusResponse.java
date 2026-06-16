package com.bear.password.module.auth.mfa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MfaStatusResponse {

    private boolean totpEnabled;
    private boolean mfaRequired;
}
