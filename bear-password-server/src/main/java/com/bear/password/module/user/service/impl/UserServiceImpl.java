package com.bear.password.module.user.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.bear.password.module.user.entity.User;
import com.bear.password.module.user.mapper.UserMapper;
import com.bear.password.module.user.service.UserService;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现
 */
@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    @Override
    public User getByUsername(String username) {
        return getOne(new LambdaQueryWrapper<User>().eq(User::getUsername, username));
    }

    @Override
    public User getByEmail(String email) {
        return getOne(new LambdaQueryWrapper<User>().eq(User::getEmail, email));
    }
}
