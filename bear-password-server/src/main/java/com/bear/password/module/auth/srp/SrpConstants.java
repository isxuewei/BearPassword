package com.bear.password.module.auth.srp;

import com.nimbusds.srp6.SRP6CryptoParams;

/**
 * SRP-6a 参数：RFC 5054 2048-bit + SHA-512，与客户端 tssrp6a 默认参数一致。
 */
public final class SrpConstants {

    public static final SRP6CryptoParams CRYPTO_PARAMS = SRP6CryptoParams.getInstance(2048, "SHA-512");

    public static final int SESSION_TTL_SECONDS = 300;

    private SrpConstants() {
    }
}
