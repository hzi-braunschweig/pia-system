BEGIN;
    ALTER TABLE questionnaire_instances DROP COLUMN IF EXISTS transmission_ts;
    ALTER TABLE questionnaire_instances ADD COLUMN IF NOT EXISTS transmission_ts_v1 TIMESTAMP NULL DEFAULT NULL;
    ALTER TABLE questionnaire_instances ADD COLUMN IF NOT EXISTS transmission_ts_v2 TIMESTAMP NULL DEFAULT NULL;
COMMIT;
