DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'type_publish') THEN
        CREATE TYPE type_publish AS ENUM ('hidden', 'testprobands', 'allaudiences');
    END IF;
END
$$;

ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS publish type_publish DEFAULT 'allaudiences';