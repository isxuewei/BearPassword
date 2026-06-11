package com.bear.password.module.user.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bear.password.module.user.entity.User;

/**
 * 用户服务接口
 */
public interface UserService extends IService<User> {

    /**
     * 根据用户名查询用户
     */
    User getByUsername(String username);

    /**
     * 根据邮箱查询用户
     */
    User getByEmail(String email);
}
