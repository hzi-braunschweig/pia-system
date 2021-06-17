CREATE TABLE personal_data
(
    pseudonym      varchar(32) PRIMARY KEY,
    study          TEXT NOT NULL,
    anrede         varchar(10)  DEFAULT NULL,
    titel          varchar(50)  DEFAULT NULL,
    name           varchar(100) DEFAULT NULL,
    vorname        varchar(100) DEFAULT NULL,
    strasse        varchar(200) DEFAULT NULL,
    haus_nr        varchar(100) DEFAULT NULL,
    plz            varchar(10)  DEFAULT NULL,
    landkreis      varchar(30)  DEFAULT NULL,
    ort            varchar(100) DEFAULT NULL,
    telefon_privat varchar(255) DEFAULT NULL,
    telefon_dienst varchar(255) DEFAULT NULL,
    telefon_mobil  varchar(255) DEFAULT NULL,
    email          varchar(255) DEFAULT NULL,
    comment        varchar(500) DEFAULT NULL
);

CREATE TABLE pending_deletions
(
    id            SERIAL PRIMARY KEY,
    study         TEXT        NOT NULL,
    requested_by  TEXT        NOT NULL,
    requested_for TEXT        NOT NULL,
    proband_id    TEXT UNIQUE NOT NULL
);
