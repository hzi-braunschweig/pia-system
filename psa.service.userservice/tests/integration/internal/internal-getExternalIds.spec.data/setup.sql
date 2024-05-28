INSERT INTO studies (name)
VALUES ('ApiTestStudie1'),
       ('ApiTestStudie2'),
       ('ApiTestStudie3');

INSERT INTO probands (pseudonym, external_id, status, compliance_contact, study, origin)
VALUES ('qtest-api-proband1', 'QTest-API-Proband1', 'active', true, 'ApiTestStudie1', 'investigator'),
       ('qtest-api-proband2', 'QTest-API-Proband2', 'deactivated', false, 'ApiTestStudie2', 'investigator'),
       ('qtest-api-proband3', 'QTest-API-Proband3', 'active', true,'ApiTestStudie2', 'investigator'),
       ('qtest-api-proband4', 'QTest-API-Proband4', 'active', true, 'ApiTestStudie1', 'investigator'),
       ('qtest-api-proband5', null, 'deactivated', true, 'ApiTestStudie1', 'investigator');
