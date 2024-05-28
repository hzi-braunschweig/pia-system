INSERT INTO studies (name)
VALUES ('ApiTestStudie1'),
       ('ApiTestStudie2'),
       ('ApiTestStudie3');

INSERT INTO probands (pseudonym, status, compliance_contact, study, origin)
VALUES ('qtest-api-proband1', 'active', true, 'ApiTestStudie1', 'investigator'),
       ('qtest-api-proband2', 'deactivated', false, 'ApiTestStudie2', 'investigator'),
       ('qtest-api-proband3', 'active', true,'ApiTestStudie3', 'investigator'),
       ('qtest-api-proband4', 'active', true, 'ApiTestStudie1', 'investigator');
