package com.bear.password.module.version.controller;

import cn.dev33.satoken.annotation.SaIgnore;
import com.bear.password.common.result.Result;
import com.bear.password.module.version.dto.VersionLatestResponse;
import com.bear.password.module.version.service.VersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 客户端版本接口
 */
@RestController
@RequestMapping("/version")
@RequiredArgsConstructor
public class VersionController {

    private final VersionService versionService;

    /**
     * 查询指定系统的最新版本
     *
     * @param system MacOS | Windows | Extension
     */
    @SaIgnore
    @GetMapping("/latest")
    public Result<VersionLatestResponse> latest(@RequestParam String system) {
        return Result.success(versionService.getLatestBySystem(system));
    }
}
