/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name, has_logging_opt_in)
VALUES ('QTestStudy1', FALSE),
       ('QTestStudy2', FALSE),
       ('QTestStudy3', TRUE),
       ('QTestStudy4', FALSE),
       ('ZIFCO-Studie', FALSE);

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),
       ('QTestProband3', '', 'Proband'),
       ('QTestProband4', '', 'Proband'),
       ('researcher1@example.com', '', 'Forscher'),
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

INSERT INTO probands (pseudonym, compliance_labresults, ids, study)
VALUES ('QTestProband1', TRUE, NULL, 'QTestStudy1'),
       ('QTestProband2', TRUE, NULL, 'QTestStudy2'),
       ('QTestProband3', TRUE, NULL, 'QTestStudy2'),
       ('QTestProband4', TRUE, 'test-ids-000', 'QTestStudy1'),
       ('QTest_IDS1', TRUE, 'QTest_IDS1', 'QTestStudy3'),
       ('QTest_IDS2', TRUE, 'QTest_IDS2', 'QTestStudy3');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudy1', 'pm1@example.com', 'write'),
       ('QTestStudy1', 'researcher1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam2@example.com', 'write'),
       ('QTestStudy2', 'researcher2@example.com', 'write'),
       ('QTestStudy2', 'researcher1@example.com', 'write'),
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
