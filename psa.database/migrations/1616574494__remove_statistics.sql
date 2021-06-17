BEGIN;
	ALTER TABLE pending_study_changes DROP COLUMN IF EXISTS statistics_active_from;
	ALTER TABLE pending_study_changes DROP COLUMN IF EXISTS statistics_active_to;

	ALTER TABLE studies DROP COLUMN IF EXISTS statistics_active;
COMMIT;
