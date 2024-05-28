INSERT INTO studies(name, description)
VALUES ('QTestStudy1', 'QTestStudy1 Beschreibung');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudy1', 'qtest-forscher2', 'write'),
       ('QTestStudy1', 'qtest-sysadmin2', 'admin');
