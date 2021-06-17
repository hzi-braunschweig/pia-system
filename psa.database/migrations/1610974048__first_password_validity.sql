BEGIN;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS initial_password_validity_date TIMESTAMP NULL;

COMMIT;
