INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung');

INSERT INTO probands (pseudonym, status, study)
VALUES ('qtest-proband1', 'active', 'ApiTestStudie'),
       ('qtest-proband2', 'deactivated', 'ApiTestStudie');
