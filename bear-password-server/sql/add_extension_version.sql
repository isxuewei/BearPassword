-- 为版本表新增浏览器扩展（Extension）类型
-- system_info 取值：MacOS | Windows | Extension

INSERT INTO bp_version (system_info, version_code, download_url, create_time, update_time, deleted)
SELECT 'Extension', '26.6.12', 'https://bear-password.xuewei.fun/releases/bear-password-extension-v26.6.12.zip', NOW(), NOW(), 0
WHERE NOT EXISTS (
    SELECT 1 FROM bp_version WHERE system_info = 'Extension' AND deleted = 0
);
