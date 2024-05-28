INSERT INTO studies(name, pseudonym_prefix)
VALUES ('QTestStudy1', 'TEST');

INSERT INTO probands(pseudonym, ids, study, origin)
VALUES ('qtest-proband1', 'exists', 'QTestStudy1', 'investigator');
