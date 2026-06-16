-- 删除 BCrypt 存量 password 列（需确认全员已迁移至 SRP）
ALTER TABLE bp_user DROP COLUMN password;
