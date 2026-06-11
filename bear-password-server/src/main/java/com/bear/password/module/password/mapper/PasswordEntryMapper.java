package com.bear.password.module.password.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bear.password.module.password.entity.PasswordEntry;
import org.apache.ibatis.annotations.Mapper;

/**
 * 密码库 Mapper
 */
@Mapper
public interface PasswordEntryMapper extends BaseMapper<PasswordEntry> {
}
