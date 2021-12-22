INSERT INTO studies(name, pseudonym_prefix)
VALUES ('QTestStudy1', 'TEST');

INSERT INTO accounts(username, password, role)
VALUES ('QTestProband1', '', 'Proband');

INSERT INTO probands(pseudonym, ids, study)
VALUES ('QTestProband1', 'exists', 'QTestStudy1');
