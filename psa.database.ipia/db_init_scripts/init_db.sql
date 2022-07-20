CREATE ROLE personaldataservice_role;
CREATE SCHEMA personaldataservice;
GRANT ALL ON SCHEMA personaldataservice TO personaldataservice_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA personaldataservice GRANT ALL ON TABLES TO personaldataservice_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA personaldataservice GRANT ALL ON SEQUENCES TO personaldataservice_role;

CREATE ROLE authserver_role;
CREATE SCHEMA authserver;
GRANT ALL ON SCHEMA authserver TO authserver_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA authserver GRANT ALL ON TABLES TO authserver_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA authserver GRANT ALL ON SEQUENCES TO authserver_role;


CREATE TABLE personaldataservice.personal_data
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

CREATE TABLE personaldataservice.pending_deletions
(
    id            SERIAL PRIMARY KEY,
    study         TEXT        NOT NULL,
    requested_by  TEXT        NOT NULL,
    requested_for TEXT        NOT NULL,
    proband_id    TEXT UNIQUE NOT NULL
);


CREATE TABLE public.db_migrations
(
    name text NOT NULL,
    date timestamp WITH TIME ZONE NOT NULL
);

INSERT INTO public.db_migrations(name, date)
VALUES ('/migrations/1638890579__create_roles_for_schemas.sql', NOW());
