-- 移除已迁入 content JSON 的冗余列
-- 执行前请确认所有条目元数据已写入 content 字段

ALTER TABLE bp_password
    DROP COLUMN password_labels,
    DROP COLUMN password_title,
    DROP COLUMN websites,
    DROP COLUMN remark;
