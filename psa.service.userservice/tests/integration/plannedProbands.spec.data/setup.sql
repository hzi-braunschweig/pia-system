INSERT INTO users(username, password, role, first_logged_in_at)
VALUES ('QTestProband1', '', 'Proband', '2021-05-20T09:34:22.760+02:00'),
       ('QTestProband2', '', 'Proband', NULL),
       ('QTestForscher1', '', 'Forscher', '2021-05-20T09:34:22.761+02:00'),
       ('QTestForscher2', '', 'Forscher', NULL),
       ('ut@apitest.de', '', 'Untersuchungsteam', NULL),
       ('ut2@apitest.de', '', 'Untersuchungsteam', NULL),
       ('QTestProbandenManager', '', 'ProbandenManager', NULL),
       ('QTestSystemAdmin', '', 'SysAdmin', NULL);
INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung'),
       ('ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'),
       ('ApiTestMultiProband', 'ApiTestMultiProband Beschreibung]'),
       ('ApiTestMultiProf', 'ApiTestMultiProf Beschreibung]');
INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie2', 'QTestProband2', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'write'),
       ('ApiTestStudie2', 'QTestForscher1', 'write'),
       ('ApiTestStudie2', 'QTestForscher2', 'write'),
       ('ApiTestStudie', 'ut@apitest.de', 'write'),
       ('ApiTestStudie2', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie', 'QTestProbandenManager', 'write'),
       ('ApiTestMultiProband', 'QTestProband1', 'read'),
       ('ApiTestMultiProband', 'QTestProband2', 'read'),
       ('ApiTestMultiProf', 'QTestForscher1', 'write'),
       ('ApiTestMultiProf', 'QTestForscher2', 'write'),
       ('ApiTestMultiProf', 'ut@apitest.de', 'write'),
       ('ApiTestMultiProf', 'QTestProbandenManager', 'write');
INSERT INTO planned_probands(user_id, password, activated_at)
VALUES ('planned1', 'aPassword1', '2021-05-20T09:34:22.762+02:00'),
       ('planned2', 'aPassword2', NULL),
       ('planned3', 'aPassword3', '2021-05-20T09:34:22.762+02:00');
INSERT INTO study_planned_probands(study_id, user_id)
VALUES ('ApiTestStudie', 'planned1'),
       ('ApiTestStudie', 'planned2'),
       ('ApiTestMultiProband', 'planned1'),
       ('ApiTestMultiProband', 'planned3');
