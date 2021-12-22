INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung');

INSERT INTO probands (pseudonym, first_logged_in_at, study)
VALUES ('QTestProband1', NOW(), 'ApiTestStudie'),
       ('QTestProband2', NOW(), 'ApiTestStudie');
