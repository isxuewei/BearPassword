package com.bear.password.module.collection.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.bear.password.module.collection.entity.PasswordCollection;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

/**
 * 密码收藏 Mapper
 */
@Mapper
public interface PasswordCollectionMapper extends BaseMapper<PasswordCollection> {

    @Select("""
            SELECT id, user_id, password_id, create_time, update_time, deleted
            FROM bp_password_collection
            WHERE user_id = #{userId} AND password_id = #{passwordId}
            LIMIT 1
            """)
    PasswordCollection selectByUserAndPassword(@Param("userId") Long userId,
                                               @Param("passwordId") Long passwordId);

    /** 恢复逻辑删除的收藏（绕过 MyBatis-Plus 逻辑删除拦截） */
    @Update("""
            UPDATE bp_password_collection
            SET deleted = 0, update_time = NOW()
            WHERE id = #{id}
            """)
    int restoreById(@Param("id") Long id);
}
