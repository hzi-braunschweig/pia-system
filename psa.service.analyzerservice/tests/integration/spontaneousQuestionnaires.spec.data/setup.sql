INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung');

INSERT INTO probands (pseudonym, first_logged_in_at, study)
VALUES ('qtest-proband1', NOW(), 'ApiTestStudie'),
       ('qtest-proband2', NOW(), 'ApiTestStudie');

-- we ad the sort order, which is not introduced by this service but necessary to test that the values are passed through
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS sort_order SMALLINT DEFAULT NULL;
ALTER TABLE questionnaire_instances ADD COLUMN IF NOT EXISTS sort_order SMALLINT DEFAULT NULL;