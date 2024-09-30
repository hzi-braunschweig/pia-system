INSERT INTO studies (name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung');

INSERT INTO probands (pseudonym, status, study)
VALUES ('qtest-proband1', 'active', 'ApiTestStudie'),
       ('qtest-proband2', 'deactivated', 'ApiTestStudie');

-- we add the custom name, which is not introduced by this service but necessary to test message queue messages
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS custom_name VARCHAR(255) DEFAULT NULL;
-- we add the sort order, which is not introduced by this service but necessary to test that the values are passed through
ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS sort_order SMALLINT DEFAULT NULL;
ALTER TABLE questionnaire_instances ADD COLUMN IF NOT EXISTS sort_order SMALLINT DEFAULT NULL;