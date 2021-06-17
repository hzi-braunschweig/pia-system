ALTER TABLE IF EXISTS compliances
    ADD COLUMN IF NOT EXISTS mapping_id uuid;

ALTER TABLE IF EXISTS compliances
    DROP CONSTRAINT IF EXISTS compliances_mapping_id_key,
    ADD CONSTRAINT compliances_mapping_id_key UNIQUE (mapping_id);

ALTER TABLE IF EXISTS compliances
    ALTER username DROP NOT NULL;

ALTER TABLE IF EXISTS compliances
    ADD COLUMN IF NOT EXISTS ids text;
