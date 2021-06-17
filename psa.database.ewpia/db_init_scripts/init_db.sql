CREATE TABLE IF NOT EXISTS compliances
(
    id                      serial,
    mapping_id              uuid      NOT NULL UNIQUE,
    study                   text      NOT NULL,
    timestamp               timestamp NOT NULL DEFAULT NOW(),
    compliance_text         text      NOT NULL,
    username                text,
    ids                     text,
    firstname               text,
    lastname                text,
    location                text,
    birthdate               date,
    compliance_app          boolean            DEFAULT FALSE,
    compliance_bloodsamples boolean            DEFAULT FALSE,
    compliance_labresults   boolean            DEFAULT FALSE,
    compliance_samples      boolean            DEFAULT FALSE,
    created_at              timestamp NOT NULL,
    updated_at              timestamp NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE questionnaire_compliances
(
    id            serial,
    placeholder   text      NOT NULL,
    value         boolean   NOT NULL DEFAULT FALSE,
    created_at    timestamp NOT NULL,
    updated_at    timestamp NOT NULL,
    compliance_id integer,
    PRIMARY KEY (id),
    FOREIGN KEY (compliance_id) REFERENCES compliances (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE questionnaire_text_compliances
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

CREATE TABLE compliance_texts
(
    id              serial,
    study           text      NOT NULL UNIQUE,
    text            text      NOT NULL,
    to_be_filled_by text default 'Proband',
    created_at      timestamp NOT NULL,
    updated_at      timestamp NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE compliance_questionnaire_placeholders
(
    id          serial,
    study       text      NOT NULL,
    placeholder text      NOT NULL,
    type        text      NOT NULL DEFAULT 'RADIO',
    label       text,
    created_at  timestamp NOT NULL,
    updated_at  timestamp NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (study, placeholder)
);

