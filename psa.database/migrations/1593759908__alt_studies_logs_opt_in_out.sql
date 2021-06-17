BEGIN;

    ALTER TABLE studies ADD COLUMN IF NOT EXISTS has_logging_opt_in BOOLEAN DEFAULT false;

    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_logging_opt_in_from BOOLEAN NOT NULL DEFAULT false;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_logging_opt_in_to BOOLEAN NOT NULL DEFAULT false;

COMMIT;
