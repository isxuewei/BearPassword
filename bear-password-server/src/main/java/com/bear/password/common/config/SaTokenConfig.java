package com.bear.password.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.stp.StpUtil;
import com.bear.password.common.constant.AuthConstants;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Sa-Token 路由拦截配置
 */
@Configuration
public class SaTokenConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SaInterceptor(handle -> StpUtil.checkLogin()))
                .addPathPatterns("/**")
                .excludePathPatterns(AuthConstants.EXCLUDE_PATHS);
    }
}
