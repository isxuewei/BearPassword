/**
 * 雪花 ID（与 MyBatis-Plus Sequence 默认算法一致）
 * 离线端使用 workerId=2、datacenterId=2，与服务端默认 1/1 区分。
 */
var TWEPOCH = 1288834974657n;
var WORKER_ID_BITS = 5n;
var DATACENTER_ID_BITS = 5n;
var SEQUENCE_BITS = 12n;
var SEQUENCE_MASK = -1n ^ (-1n << SEQUENCE_BITS);
var WORKER_ID_SHIFT = SEQUENCE_BITS;
var DATACENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;
var TIMESTAMP_LEFT_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATACENTER_ID_BITS;
/** 离线客户端 worker / datacenter（服务端应使用不同值） */
export var OFFLINE_SNOWFLAKE_WORKER_ID = 2;
export var OFFLINE_SNOWFLAKE_DATACENTER_ID = 2;
var SnowflakeSequence = /** @class */ (function () {
    function SnowflakeSequence(workerId, datacenterId) {
        this.workerId = workerId;
        this.datacenterId = datacenterId;
        this.lastTimestamp = -1n;
        this.sequence = 0n;
    }
    SnowflakeSequence.prototype.nextId = function () {
        return this.nextIdBigInt().toString();
    };
    SnowflakeSequence.prototype.nextIdBigInt = function () {
        var timestamp = BigInt(Date.now());
        if (timestamp < this.lastTimestamp) {
            throw new Error('Clock moved backwards. Refusing to generate snowflake id.');
        }
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & SEQUENCE_MASK;
            if (this.sequence === 0n) {
                timestamp = this.tilNextMillis(this.lastTimestamp);
            }
        }
        else {
            this.sequence = BigInt(Math.floor(Math.random() * 2) + 1);
        }
        this.lastTimestamp = timestamp;
        var id = ((timestamp - TWEPOCH) << TIMESTAMP_LEFT_SHIFT) |
            (this.datacenterId << DATACENTER_ID_SHIFT) |
            (this.workerId << WORKER_ID_SHIFT) |
            this.sequence;
        return id;
    };
    SnowflakeSequence.prototype.nextIdString = function () {
        return this.nextIdBigInt().toString();
    };
    SnowflakeSequence.prototype.tilNextMillis = function (lastTimestamp) {
        var timestamp = BigInt(Date.now());
        while (timestamp <= lastTimestamp) {
            timestamp = BigInt(Date.now());
        }
        return timestamp;
    };
    return SnowflakeSequence;
}());
var offlineSequence = null;
function getOfflineSequence() {
    if (!offlineSequence) {
        offlineSequence = new SnowflakeSequence(BigInt(OFFLINE_SNOWFLAKE_WORKER_ID), BigInt(OFFLINE_SNOWFLAKE_DATACENTER_ID));
    }
    return offlineSequence;
}
/** 生成离线模式密码条目 ID（字符串，避免精度丢失） */
export function generateOfflineSnowflakeId() {
    return getOfflineSequence().nextIdString();
}
