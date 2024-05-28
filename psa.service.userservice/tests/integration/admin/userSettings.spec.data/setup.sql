INSERT INTO studies (name)
VALUES ('QTestStudie1'),
       ('QTestStudie2');

INSERT INTO probands (pseudonym, study, origin)
VALUES ('qtest-proband1', 'QTestStudie1', 'investigator'),
       ('qtest-proband2', 'QTestStudie2', 'investigator');
