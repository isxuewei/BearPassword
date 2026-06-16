package com.bear.password.common.constant;

/**
 * 认证相关常量
 */
public final class AuthConstants {

    private AuthConstants() {
    }

    /**
     * Session 中存储的用户名
     */
    public static final String SESSION_USERNAME = "username";

    /**
     * Session 中存储的头像
     */
    public static final String SESSION_AVATAR = "avatar";

    /**
     * 无需登录即可访问的路径
     */
    public static final String[] EXCLUDE_PATHS = {
            "/auth/login/init",
            "/auth/login/verify",
            "/auth/register",
            "/auth/register/code",
            "/health",
            "/version/latest",
            "/error",
            "/druid/**"
    };
}
