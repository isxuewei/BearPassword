-- 移除 Passkey 凭证表（若曾执行过含 Passkey 的迁移脚本）
DROP TABLE IF EXISTS bp_user_passkey;
