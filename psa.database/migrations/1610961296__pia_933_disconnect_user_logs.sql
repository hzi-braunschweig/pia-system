ALTER TABLE IF EXISTS user_logs
    DROP CONSTRAINT IF EXISTS fk_user_id;DO
$$
    BEGIN
        IF EXISTS(SELECT * FROM information_schema.tables WHERE table_name = 'user_logs')
        THEN
            CREATE INDEX IF NOT EXISTS user_logs_user_id ON user_logs (user_id);
        END IF;
    END
$$;
