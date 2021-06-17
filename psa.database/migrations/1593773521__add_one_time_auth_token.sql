CREATE TABLE IF NOT EXISTS one_time_auth_token
(
    token char(64) not null,
    created_at timestamp DEFAULT NOW()
);

COMMENT ON TABLE one_time_auth_token IS 'Creates one time auth tokens for PIA Sormas authentication';

CREATE UNIQUE INDEX IF NOT EXISTS one_time_auth_token_token_uindex
    ON one_time_auth_token (token);

INSERT INTO users (username, password, role, account_status)
VALUES ('sormas-client', 'no-password-required', 'ProbandenManager', 'no_account') ON CONFLICT DO NOTHING;