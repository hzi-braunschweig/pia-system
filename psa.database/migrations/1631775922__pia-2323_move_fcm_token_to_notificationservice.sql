BEGIN;

CREATE TABLE fcm_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    pseudonym TEXT NOT NULL,
    study TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (token, pseudonym, study)
);

INSERT INTO fcm_tokens (token, pseudonym, study) (
    SELECT fcm_token AS token, username AS pseudonym, study_id AS study

    FROM users
    INNER JOIN study_users ON user_id = username

    WHERE fcm_token IS NOT NULL
    AND fcm_token <> ''
    AND fcm_token  <> 'false'
    AND username IS NOT NULL
    AND study_id IS NOT NULL
);

ALTER TABLE users DROP COLUMN IF EXISTS fcm_token;

END;
