package com.bear.password.module.auth.mfa.support;

import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
public class MfaSessionData implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long userId;
    private String username;
    private String avatar;
}
