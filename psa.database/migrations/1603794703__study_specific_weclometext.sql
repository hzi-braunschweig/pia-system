BEGIN;

CREATE TABLE IF NOT EXISTS study_welcome_text (
    study_id TEXT NOT NULL,
    welcome_text TEXT DEFAULT NULL,
    language TEXT DEFAULT 'de_DE',
    PRIMARY KEY (study_id, language),
    CONSTRAINT fk_study_id
    FOREIGN KEY (study_id)
    REFERENCES studies(name)
    ON DELETE CASCADE
);

COMMIT;
