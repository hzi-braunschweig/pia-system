ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS cycle_per_day INT NULL;
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS cycle_first_hour INT NULL;