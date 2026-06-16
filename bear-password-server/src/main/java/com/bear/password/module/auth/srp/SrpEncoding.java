package com.bear.password.module.auth.srp;

import org.springframework.util.StringUtils;

import java.math.BigInteger;

public final class SrpEncoding {

    private SrpEncoding() {
    }

    public static BigInteger parseHex(String value) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalArgumentException("SRP 数值不能为空");
        }
        String normalized = value.trim();
        if (normalized.startsWith("0x") || normalized.startsWith("0X")) {
            normalized = normalized.substring(2);
        }
        return new BigInteger(normalized, 16);
    }

    public static String toHex(BigInteger value) {
        return value.toString(16);
    }
}
