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

INSERT INTO probands (pseudonym, ids, study, origin)
VALUES ('qtest-proband1', NULL, 'QTestStudy1', 'investigator'),
       ('qtest-proband2', NULL, 'QTestStudy2', 'investigator'),
       ('qtest-proband3', NULL, 'QTestStudy2', 'investigator'),
       ('qtest-proband4', NULL, 'QTestStudy1', 'investigator'),
       ('qtest-ids1', 'QTest-IDS1', 'QTestStudy3', 'investigator'),
       ('qtest-ids2', 'qtest-ids2', 'QTestStudy3', 'investigator');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudy1', 'pm1@example.com', 'write'),
       ('QTestStudy1', 'researcher1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam1@example.com', 'write'),
       ('QTestStudy3', 'investigationteam1@example.com', 'write'),
       ('ZIFCO-Studie', 'investigationteam2@example.com', 'write');

INSERT INTO planned_probands(user_id, password)
VALUES ('qtest-proband_new0', ''),
       ('qtest-proband_new1', ''),
       ('qtest-proband_new2', ''),
       ('qtest-proband_new3', '');

INSERT INTO study_planned_probands(study_id, user_id)
VALUES ('ZIFCO-Studie', 'qtest-proband_new0'),
       ('ZIFCO-Studie', 'qtest-proband_new1'),
       ('QTestStudy1', 'qtest-proband_new1'),
       ('QTestStudy3', 'qtest-proband_new2'),
       ('QTestStudy3', 'qtest-proband_new3');
