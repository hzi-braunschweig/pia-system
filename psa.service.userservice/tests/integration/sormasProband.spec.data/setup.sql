INSERT INTO users(username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestForscher1', '', 'Forscher'),
       ('QTestUntersucher', '', 'Untersuchungsteam'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestEinwilligungsManager', '', 'EinwilligungsManager'),
       ('QTestSystemAdmin', '', 'SysAdmin');

INSERT INTO users(username, password, role, ids)
VALUES ('APITEST-00000', '', 'Proband', 'exists');

INSERT INTO studies(name, pseudonym_prefix, pseudonym_suffix_length)
VALUES ('ApiTestStudy1', 'APITEST', 5),
       ('ApiTestStudy2', 'APITEST', 5),
       ('ApiTestStudy3', 'APITEST', 5);

INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestStudy1', 'QTestProbandenManager', 'admin'),
       ('ApiTestStudy2', 'QTestProbandenManager', 'admin');
