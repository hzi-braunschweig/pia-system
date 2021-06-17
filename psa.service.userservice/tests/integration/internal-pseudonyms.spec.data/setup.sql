INSERT INTO users (username, password, role, account_status)
VALUES ('ApiTestProband1', '', 'Proband', 'active'),
       ('ApiTestProband2', '', 'Proband', 'deactivated'),
       ('ApiTestProband3', '', 'Proband', 'deactivation_pending'),
       ('ApiTestProband4', '', 'Proband', 'no_account');
INSERT INTO studies
VALUES ('ApiTestStudie1', 'ApiTestStudie1 Beschreibung'),
       ('ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'),
       ('ApiTestStudie3', 'ApiTestStudie3 Beschreibung]');
INSERT INTO study_users
VALUES ('ApiTestStudie1', 'ApiTestProband1', 'read'),
       ('ApiTestStudie2', 'ApiTestProband2', 'read'),
       ('ApiTestStudie3', 'ApiTestProband3', 'read'),
       ('ApiTestStudie1', 'ApiTestProband4', 'read');
