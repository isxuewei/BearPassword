package com.bear.password.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 当前登录用户信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponse {

    private Long userId;
    private String username;
    private String avatar;
}
