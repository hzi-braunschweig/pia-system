DO
$$
    BEGIN
        IF NOT EXISTS(SELECT *
                      FROM information_schema.columns
                      WHERE table_name = 'pending_partial_deletions'
                        AND column_name = 'proband_id')
        THEN
            TRUNCATE pending_partial_deletions;

            ALTER TABLE IF EXISTS pending_partial_deletions
                ADD COLUMN IF NOT EXISTS proband_id  TEXT    NOT NULL,
                ADD COLUMN IF NOT EXISTS delete_logs BOOLEAN NULL,
                ADD CONSTRAINT fk_proband_id
                    FOREIGN KEY (proband_id)
                        REFERENCES users (username)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE;
        END IF;
    END
$$;
