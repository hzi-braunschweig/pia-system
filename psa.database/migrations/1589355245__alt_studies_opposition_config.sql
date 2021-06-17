BEGIN;

    ALTER TABLE studies ADD COLUMN IF NOT EXISTS has_four_eyes_opposition BOOLEAN DEFAULT true;
    ALTER TABLE studies ADD COLUMN IF NOT EXISTS has_partial_opposition BOOLEAN DEFAULT true;
    ALTER TABLE studies ADD COLUMN IF NOT EXISTS has_total_opposition BOOLEAN DEFAULT true;
    ALTER TABLE studies ADD COLUMN IF NOT EXISTS has_compliance_opposition BOOLEAN DEFAULT true;


    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_four_eyes_opposition_from BOOLEAN NOT NULL;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_four_eyes_opposition_to BOOLEAN NOT NULL;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_partial_opposition_from BOOLEAN NOT NULL;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_partial_opposition_to BOOLEAN NOT NULL;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_total_opposition_from BOOLEAN NOT NULL;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_total_opposition_to BOOLEAN NOT NULL;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_compliance_opposition_from BOOLEAN NOT NULL;
    ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS has_compliance_opposition_to BOOLEAN NOT NULL;

COMMIT;