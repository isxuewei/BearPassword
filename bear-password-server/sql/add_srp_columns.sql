-- SRP-6a 登录：新增 salt / verifier
ALTER TABLE bp_user
    ADD COLUMN srp_salt VARCHAR(512) NULL COMMENT 'SRP salt（hex）',
    ADD COLUMN srp_verifier VARCHAR(2048) NULL COMMENT 'SRP verifier（hex）';
