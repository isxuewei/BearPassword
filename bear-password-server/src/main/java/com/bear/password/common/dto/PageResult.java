package com.bear.password.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 分页响应结构（与桌面端 PageResult 对齐）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> {

    private List<T> list;
    private long total;
    private long page;
    private long pageSize;
}
