BEGIN;
    ALTER TABLE studies ADD COLUMN IF NOT EXISTS has_answers_notify_feature BOOLEAN DEFAULT false;
    ALTER TABLE studies ADD COLUMN IF NOT EXISTS has_answers_notify_feature_by_mail BOOLEAN DEFAULT false;
    CREATE TABLE IF NOT EXISTS pending_study_changes (
        id SERIAL PRIMARY KEY,
        requested_by TEXT NOT NULL,
        requested_for TEXT NOT NULL,
        study_id TEXT NOT NULL,
        description_from TEXT,
        description_to TEXT,
        has_rna_samples_from BOOLEAN NOT NULL,
        has_rna_samples_to BOOLEAN NOT NULL,
        sample_prefix_from TEXT,
        sample_prefix_to TEXT,
        sample_suffix_length_from INT,
        sample_suffix_length_to INT,
        has_answers_notify_feature_from BOOLEAN NOT NULL,
        has_answers_notify_feature_to BOOLEAN NOT NULL,
        has_answers_notify_feature_by_mail_from BOOLEAN NOT NULL,
        has_answers_notify_feature_by_mail_to BOOLEAN NOT NULL,
        CONSTRAINT fk_requested_by
            FOREIGN KEY (requested_by)
            REFERENCES users(username)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        CONSTRAINT fk_requested_for
            FOREIGN KEY (requested_for)
            REFERENCES users(username)
            ON DELETE CASCADE
            ON UPDATE CASCADE,
        CONSTRAINT fk_study_id
            FOREIGN KEY (study_id)
            REFERENCES studies(name)
            ON DELETE CASCADE
            ON UPDATE CASCADE
    );

COMMIT;
BEGIN;
    ALTER TABLE questionnaires
      ADD COLUMN IF NOT EXISTS notify_when_not_filled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS notify_when_not_filled_time TEXT NULL,
      ADD COLUMN IF NOT EXISTS notify_when_not_filled_day INT NULL;
    ALTER TABLE answer_options ADD COLUMN IF NOT EXISTS  is_notable BOOLEAN[] DEFAULT '{}';
COMMIT;
BEGIN;
    CREATE TABLE IF NOT EXISTS users_to_contact (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      notable_answer_questionnaire_instances INTEGER [] DEFAULT '{}',
      is_notable_answer BOOLEAN NULL,
      is_notable_answer_at timestamp NULL,
      not_filledout_questionnaire_instances INTEGER [] DEFAULT '{}',
      is_not_filledout BOOLEAN NULL,
      is_not_filledout_at timestamp NULL,
      processed BOOLEAN NOT NULL DEFAULT FALSE,
      processed_at timestamp NULL,
      created_at timestamp DEFAULT NOW(),
      CONSTRAINT fk_user_id
          FOREIGN KEY (user_id)
          REFERENCES users(username)
          ON DELETE CASCADE
          ON UPDATE CASCADE
  );
    ALTER table notification_schedules ALTER COLUMN user_id DROP NOT NULL;
COMMIT;
