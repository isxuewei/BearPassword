/** 自动锁定时长（分钟，0 表示从不） */
export type AutoLockMinutes = 0 | 1 | 5 | 10 | 30 | 60 | 180 | 300

export const AUTO_LOCK_OPTIONS: { label: string; value: AutoLockMinutes }[] = [
  { label: '1 分钟', value: 1 },
  { label: '5 分钟', value: 5 },
  { label: '10 分钟', value: 10 },
  { label: '30 分钟', value: 30 },
  { label: '1 小时', value: 60 },
  { label: '3 小时', value: 180 },
  { label: '5 小时', value: 300 },
  { label: '从不', value: 0 }
]

export const DEFAULT_AUTO_LOCK_MINUTES: AutoLockMinutes = 5
