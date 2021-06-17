ALTER TABLE studies ADD COLUMN IF NOT EXISTS pseudonym_prefix text;
ALTER TABLE studies ADD COLUMN IF NOT EXISTS pseudonym_suffix_length integer;
ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS pseudonym_prefix_from text;
ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS pseudonym_prefix_to text;
ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS pseudonym_suffix_length_from integer;
ALTER TABLE pending_study_changes ADD COLUMN IF NOT EXISTS pseudonym_suffix_length_to integer;
