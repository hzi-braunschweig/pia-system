INSERT INTO studies(name, pseudonym_prefix)
VALUES ('QTestStudy1', 'TEST'),
       ('QTestStudy2', 'TEST');

INSERT INTO accounts(username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband');

INSERT INTO probands(pseudonym, ids, study)
VALUES ('QTestProband1', 'exists', 'QTestStudy1'),
       ('QTestProband2', NULL, 'QTestStudy2');
