INSERT INTO studies (name)
VALUES ('QTestStudie1'),
       ('QTestStudie2');

INSERT INTO probands (pseudonym, study)
VALUES ('qtest-proband1', 'QTestStudie1'),
       ('qtest-proband2', 'QTestStudie2');
