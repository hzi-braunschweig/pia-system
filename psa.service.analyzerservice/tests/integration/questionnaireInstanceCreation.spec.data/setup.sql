INSERT INTO users (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestForscher1', '', 'Forscher');
INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung'),
       ('ApiTestMultiStudie', 'ApiTestMultiStudie Beschreibung');
INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestMultiStudie', 'QTestProband1', 'read'),
       ('ApiTestMultiStudie', 'QTestForscher1', 'write');
INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'write');
