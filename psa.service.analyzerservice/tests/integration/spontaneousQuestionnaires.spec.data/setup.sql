INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung');

INSERT INTO probands (pseudonym, first_logged_in_at, study)
VALUES ('qtest-proband1', NOW(), 'ApiTestStudie'),
       ('qtest-proband2', NOW(), 'ApiTestStudie');
