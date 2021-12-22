/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('QTestStudy1'),
       ('QTestStudy2'),
       ('QTestStudy3'),
       ('ZIFCO-Studie');

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),
       ('QTestProband3', '', 'Proband'),
       ('QTestProband4', '', 'Proband'),
       ('researcher1@example.com', '', 'Forscher'),
       ('investigationteam1@example.com', '', 'Untersuchungsteam'),
       ('investigationteam2@example.com', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin1', '', 'SysAdmin'),
       ('pm1@example.com', '', 'ProbandenManager');

INSERT INTO probands (pseudonym, ids, study)
VALUES ('QTestProband1', NULL, 'QTestStudy1'),
       ('QTestProband2', NULL, 'QTestStudy2'),
       ('QTestProband3', NULL, 'QTestStudy2'),
       ('QTestProband4', NULL, 'QTestStudy1'),
       ('QTest_IDS1', 'QTest_IDS1', 'QTestStudy3'),
       ('QTest_IDS2', 'QTest_IDS2', 'QTestStudy3');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudy1', 'pm1@example.com', 'write'),
       ('QTestStudy1', 'researcher1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam1@example.com', 'write'),
       ('QTestStudy3', 'investigationteam1@example.com', 'write'),
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
