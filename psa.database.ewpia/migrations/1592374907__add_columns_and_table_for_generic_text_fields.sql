ALTER TABLE compliance_questionnaire_placeholders
    ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'RADIO',
    ADD COLUMN IF NOT EXISTS label TEXT;

CREATE TABLE IF NOT EXISTS questionnaire_text_compliances
(
    id            serial,
    placeholder   text      NOT NULL,
    value         text      NOT NULL,
    created_at    timestamp NOT NULL,
    updated_at    timestamp NOT NULL,
    compliance_id integer,
    PRIMARY KEY (id),
    FOREIGN KEY (compliance_id) REFERENCES compliances (id) ON UPDATE CASCADE ON DELETE CASCADE
);
