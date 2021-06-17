INSERT INTO users (username, password, role, notification_time)
VALUES ('QTestProband1', '', 'Proband', '13:25'),
       ('QTestForscher1', '', 'Forscher', null);
INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung'),
       ('ApiTestMultiStudie', 'ApiTestMultiStudie Beschreibung');
INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestMultiStudie', 'QTestProband1', 'read'),
       ('ApiTestMultiStudie', 'QTestForscher1', 'write');
INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'write');
