INSERT INTO users (username, password, role, compliance_labresults, ids)
VALUES ('QTestProband1', 'notEmpty', 'Proband', TRUE, NULL),
       ('QTestProband2', 'notEmpty', 'Proband', TRUE, NULL),
       ('QTestProband3', 'notEmpty', 'Proband', TRUE, NULL),
       ('QTestProband4', 'notEmpty', 'Proband', TRUE, NULL),
       ('QTest_IDS1', 'notEmpty', 'Proband', TRUE, 'QTest_IDS1'),
       ('QTest_IDS2', 'notEmpty', 'Proband', TRUE, 'QTest_IDS2');

INSERT INTO users (username, password, role)
VALUES ('researcher1@example.com', '', 'Forscher'),
       ('researcher2@example.com', '', 'Forscher'),
       ('researcher3@example.com', '', 'Forscher'),
       ('researcher4@example.com', '', 'Forscher'),
       ('researcher5@example.com', '', 'Forscher'),
       ('investigationteam1@example.com', '', 'Untersuchungsteam'),
       ('investigationteam2@example.com', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin1', '', 'SysAdmin'),
       ('QTestSystemAdmin2', '', 'SysAdmin'),
       ('QTestSystemAdmin3', '', 'SysAdmin'),
       ('pm1@example.com', '', 'ProbandenManager'),
       ('pm2@example.com', '', 'ProbandenManager'),
       ('pm3@example.com', '', 'ProbandenManager');

INSERT INTO studies (name, description, has_logging_opt_in)
VALUES ('QTestStudy1', 'QTestStudy1 Beschreibung', FALSE),
       ('QTestStudy2', 'QTestStudy2 Beschreibung', FALSE),
       ('QTestStudy3', 'QTestStudy3 Beschreibung', TRUE),
       ('QTestStudy4', 'QTestStudy4 Beschreibung', FALSE),
       ('ZIFCO-Studie', 'ZIFCO Studie', FALSE);

INSERT INTO study_users
VALUES ('QTestStudy1', 'QTestProband1', 'read'),
       ('QTestStudy1', 'QTestProband4', 'read'),
       ('QTestStudy1', 'pm1@example.com', 'write'),
       ('QTestStudy1', 'researcher1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam2@example.com', 'write'),
       ('QTestStudy2', 'QTestProband2', 'read'),
       ('QTestStudy2', 'QTestProband3', 'read'),
       ('QTestStudy2', 'researcher2@example.com', 'write'),
       ('QTestStudy2', 'researcher1@example.com', 'write'),
       ('QTestStudy3', 'QTest_IDS2', 'read'),
       ('QTestStudy3', 'investigationteam1@example.com', 'write'),
       ('QTestStudy3', 'researcher1@example.com', 'write'),
       ('QTestStudy3', 'researcher3@example.com', 'write'),
       ('QTestStudy3', 'pm1@example.com', 'write'),
       ('QTestStudy3', 'pm2@example.com', 'write'),
       ('QTestStudy3', 'pm3@example.com', 'write'),
       ('QTestStudy4', 'researcher4@example.com', 'write'),
       ('ZIFCO-Studie', 'investigationteam2@example.com', 'write');


INSERT INTO pending_compliance_changes(requested_by, requested_for, proband_id, compliance_labresults_from,
                                       compliance_labresults_to, compliance_samples_from, compliance_samples_to,
                                       compliance_bloodsamples_from, compliance_bloodsamples_to)
VALUES ('pm1@example.com', 'pm2@example.com', 'QTestProband4', TRUE, TRUE, TRUE, FALSE, TRUE, TRUE);

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
