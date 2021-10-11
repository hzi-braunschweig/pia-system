INSERT INTO users (username, password, role, ids, account_status, study_status)
VALUES ('QTestProband1', 'notEmpty', 'Proband', NULL, 'active', 'active'),
       ('QTestProband2', 'notEmpty', 'Proband', NULL, 'active', 'active'),
       ('QTestProband3', 'notEmpty', 'Proband', NULL, 'active', 'active'),
       ('QTestProband4', 'notEmpty', 'Proband', NULL, 'active', 'active'),
       ('QTest_IDS1', 'notEmpty', 'Proband', 'QTest_IDS1', 'no_account', 'active'),
       ('QTest_IDS2', 'notEmpty', 'Proband', 'QTest_IDS2', 'no_account', 'active');

INSERT INTO users (username, password, role)
VALUES ('researcher1@example.com', '', 'Forscher'),
       ('investigationteam1@example.com', '', 'Untersuchungsteam'),
       ('investigationteam2@example.com', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin1', '', 'SysAdmin'),
       ('pm1@example.com', '', 'ProbandenManager');

INSERT INTO studies (name, description)
VALUES ('QTestStudy1', 'QTestStudy1 Beschreibung'),
       ('QTestStudy2', 'QTestStudy2 Beschreibung'),
       ('QTestStudy3', 'QTestStudy3 Beschreibung'),
       ('ZIFCO-Studie', 'ZIFCO-Studie Beschreibung');

INSERT INTO study_users
VALUES ('QTestStudy1', 'QTestProband1', 'read'),
       ('QTestStudy1', 'QTestProband4', 'read'),
       ('QTestStudy1', 'pm1@example.com', 'write'),
       ('QTestStudy1', 'researcher1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam1@example.com', 'write'),
       ('QTestStudy2', 'QTestProband2', 'read'),
       ('QTestStudy2', 'QTestProband3', 'read'),
       ('QTestStudy3', 'investigationteam1@example.com', 'write'),
       ('QTestStudy3', 'QTest_IDS1', 'read'),
       ('QTestStudy3', 'QTest_IDS2', 'read'),
       ('ZIFCO-Studie', 'investigationteam2@example.com', 'write');

INSERT INTO planned_probands(user_id, password)
VALUES ('QTestProbandNew0', ''),
       ('QTestProbandNew1', ''),
       ('QTestProbandNew2', ''),
       ('QTestProbandNew3', '');

INSERT INTO study_planned_probands(study_id, user_id)
VALUES ('ZIFCO-Studie', 'QTestProbandNew0'),
       ('ZIFCO-Studie', 'QTestProbandNew1'),
       ('QTestStudy1', 'QTestProbandNew1'),
       ('QTestStudy3', 'QTestProbandNew2'),
       ('QTestStudy3', 'QTestProbandNew3');
