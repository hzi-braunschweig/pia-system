ALTER TABLE IF EXISTS t_participant
    RENAME TO personal_data;

ALTER TABLE IF EXISTS personal_data
    DROP COLUMN IF EXISTS account_status,
    DROP COLUMN IF EXISTS date_of_birth,
    ADD COLUMN IF NOT EXISTS study TEXT NULL;
