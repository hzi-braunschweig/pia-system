INSERT INTO users (username, password, role, first_logged_in_at)
VALUES ('QTestProband1', '', 'Proband', NOW()),
       ('QTestProband2', '', 'Proband', NOW()),
       ('QTestForscher1', '', 'Forscher', NOW());
INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung');
INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie', 'QTestProband2', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'write');
