/**
 * 雪花 ID（与 MyBatis-Plus Sequence 默认算法一致）
 * 离线端使用 workerId=2、datacenterId=2，与服务端默认 1/1 区分。
 */
/** 离线客户端 worker / datacenter（服务端应使用不同值） */
export declare const OFFLINE_SNOWFLAKE_WORKER_ID = 2;
export declare const OFFLINE_SNOWFLAKE_DATACENTER_ID = 2;
/** 生成离线模式密码条目 ID（字符串，避免精度丢失） */
export declare function generateOfflineSnowflakeId(): string;
