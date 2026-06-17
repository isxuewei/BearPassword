-- 密码表主键改为雪花 ID（移除自增）
ALTER TABLE bp_password
    MODIFY COLUMN id BIGINT NOT NULL COMMENT '主键（雪花 ID）';
