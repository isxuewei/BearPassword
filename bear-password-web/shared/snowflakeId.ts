/**
 * 雪花 ID（与 MyBatis-Plus Sequence 默认算法一致）
 * 离线端使用 workerId=2、datacenterId=2，与服务端默认 1/1 区分。
 */

const TWEPOCH = 1288834974657n
const WORKER_ID_BITS = 5n
const DATACENTER_ID_BITS = 5n
const SEQUENCE_BITS = 12n

const SEQUENCE_MASK = -1n ^ (-1n << SEQUENCE_BITS)
const WORKER_ID_SHIFT = SEQUENCE_BITS
const DATACENTER_ID_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS
const TIMESTAMP_LEFT_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS + DATACENTER_ID_BITS

/** 离线客户端 worker / datacenter（服务端应使用不同值） */
export const OFFLINE_SNOWFLAKE_WORKER_ID = 2
export const OFFLINE_SNOWFLAKE_DATACENTER_ID = 2

class SnowflakeSequence {
  private lastTimestamp = -1n
  private sequence = 0n

  constructor(
    private readonly workerId: bigint,
    private readonly datacenterId: bigint
  ) {}

  nextId(): string {
    return this.nextIdBigInt().toString()
  }

  nextIdBigInt(): bigint {
    let timestamp = BigInt(Date.now())

    if (timestamp < this.lastTimestamp) {
      throw new Error('Clock moved backwards. Refusing to generate snowflake id.')
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & SEQUENCE_MASK
      if (this.sequence === 0n) {
        timestamp = this.tilNextMillis(this.lastTimestamp)
      }
    } else {
      this.sequence = BigInt(Math.floor(Math.random() * 2) + 1)
    }

    this.lastTimestamp = timestamp

    const id =
      ((timestamp - TWEPOCH) << TIMESTAMP_LEFT_SHIFT) |
      (this.datacenterId << DATACENTER_ID_SHIFT) |
      (this.workerId << WORKER_ID_SHIFT) |
      this.sequence

    return id
  }

  nextIdString(): string {
    return this.nextIdBigInt().toString()
  }

  private tilNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = BigInt(Date.now())
    while (timestamp <= lastTimestamp) {
      timestamp = BigInt(Date.now())
    }
    return timestamp
  }
}

let offlineSequence: SnowflakeSequence | null = null

function getOfflineSequence(): SnowflakeSequence {
  if (!offlineSequence) {
    offlineSequence = new SnowflakeSequence(
      BigInt(OFFLINE_SNOWFLAKE_WORKER_ID),
      BigInt(OFFLINE_SNOWFLAKE_DATACENTER_ID)
    )
  }
  return offlineSequence
}

/** 生成离线模式密码条目 ID（字符串，避免精度丢失） */
export function generateOfflineSnowflakeId(): string {
  return getOfflineSequence().nextIdString()
}
