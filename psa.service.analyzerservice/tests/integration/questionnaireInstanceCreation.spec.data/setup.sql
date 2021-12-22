INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung');

INSERT INTO probands (pseudonym, status, study)
VALUES ('QTestProband1', 'active', 'ApiTestStudie'),
       ('QTestProband2', 'deactivated', 'ApiTestStudie');
