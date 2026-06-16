package com.bear.password.module.recent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bear.password.module.recent.entity.PasswordRecentVisit;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/**
 * 密码最近访问 Mapper
 */
@Mapper
public interface PasswordRecentVisitMapper extends BaseMapper<PasswordRecentVisit> {

    @Select("""
            SELECT id, user_id, password_id, create_time, update_time, deleted
            FROM bp_password_recent_visit
            WHERE user_id = #{userId} AND password_id = #{passwordId}
            LIMIT 1
            """)
    PasswordRecentVisit selectByUserAndPassword(@Param("userId") Long userId,
                                                @Param("passwordId") Long passwordId);

    /**
     * 恢复逻辑删除的访问记录（绕过 MyBatis-Plus 逻辑删除拦截）
     */
    @Update("""
            UPDATE bp_password_recent_visit
            SET deleted = 0, update_time = NOW()
            WHERE id = #{id}
            """)
    int restoreById(@Param("id") Long id);
}
