package com.bear.password.module.auth.srp;

import com.nimbusds.srp6.SRP6ServerSession;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SrpLoginSessionData implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long userId;
    private String identity;
    private SRP6ServerSession serverSession;
    private boolean passwordChange;
}
