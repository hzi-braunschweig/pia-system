INSERT INTO studies (name)
VALUES ('QTestStudie1'),
       ('QTestStudie2');

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),

       ('QTestForscher1', '', 'Forscher'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin', '', 'SysAdmin');

INSERT INTO probands (pseudonym, study)
VALUES ('QTestProband1', 'QTestStudie1'),
       ('QTestProband2', 'QTestStudie2');
