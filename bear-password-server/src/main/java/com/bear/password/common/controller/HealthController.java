package com.bear.password.common.controller;

import cn.dev33.satoken.annotation.SaIgnore;
import com.bear.password.common.result.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 健康检查接口
 */
@RestController
public class HealthController {

    @SaIgnore
    @GetMapping("/health")
    public Result<Map<String, Object>> health() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("status", "UP");
        info.put("service", "bear-password-server");
        return Result.success(info);
    }
}
