package com.bear.password.module.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 用户名可用性校验结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsernameCheckResponse {

    private boolean available;
}
