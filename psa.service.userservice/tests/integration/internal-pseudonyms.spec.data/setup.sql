INSERT INTO studies (name)
VALUES ('ApiTestStudie1'),
       ('ApiTestStudie2'),
       ('ApiTestStudie3');

INSERT INTO accounts (username, password, role)
VALUES ('ApiTestProband1', '', 'Proband'),
       ('ApiTestProband2', '', 'Proband'),
       ('ApiTestProband3', '', 'Proband'),
       ('ApiTestProband4', '', 'Proband');

INSERT INTO probands (pseudonym, status, compliance_contact, study)
VALUES ('ApiTestProband1', 'active', true, 'ApiTestStudie1'),
       ('ApiTestProband2', 'deactivated', false, 'ApiTestStudie2'),
       ('ApiTestProband3', 'active', true,'ApiTestStudie3'),
       ('ApiTestProband4', 'active', true, 'ApiTestStudie1');
