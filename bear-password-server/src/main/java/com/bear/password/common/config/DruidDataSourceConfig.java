package com.bear.password.common.config;

import com.alibaba.druid.pool.DruidDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Druid 连接池启动校验
 */
@Slf4j
@Component
@ConditionalOnClass(DruidDataSource.class)
public class DruidDataSourceConfig {

    private final DataSource dataSource;

    public DruidDataSourceConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logPoolInfo() {
        if (!(dataSource instanceof DruidDataSource druidDataSource)) {
            log.warn("当前 DataSource 不是 DruidDataSource，实际类型：{}", dataSource.getClass().getName());
            return;
        }
        log.info(
                "Druid 连接池已启用：initialSize={}, minIdle={}, maxActive={}, active={}, idle={}",
                druidDataSource.getInitialSize(),
                druidDataSource.getMinIdle(),
                druidDataSource.getMaxActive(),
                druidDataSource.getActiveCount(),
                druidDataSource.getPoolingCount()
        );
    }
}
