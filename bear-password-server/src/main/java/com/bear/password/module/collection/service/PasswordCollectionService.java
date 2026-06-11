package com.bear.password.module.collection.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.bear.password.common.dto.PageResult;
import com.bear.password.module.collection.entity.PasswordCollection;
import com.bear.password.module.password.dto.PasswordEntryResponse;

import java.util.List;

/**
 * 密码收藏服务
 */
public interface PasswordCollectionService extends IService<PasswordCollection> {

    PageResult<PasswordEntryResponse> pageFavorites(long userId, long page, long pageSize, String keyword);

    void addFavorite(long userId, Long passwordId);

    void removeFavorite(long userId, Long passwordId);

    List<Long> listFavoritePasswordIds(long userId);

    long countFavorites(long userId);
}
