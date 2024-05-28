/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('QTestStudy1'),
       ('QTestStudy2'),
       ('QTestStudy3');

INSERT INTO probands (pseudonym, ids, study, origin)
VALUES ('qtest-1111', NULL, 'QTestStudy1', 'investigator'),
       ('qtest-2222', NULL, 'QTestStudy2', 'investigator'),
       ('qtest-3333', NULL, 'QTestStudy2', 'investigator'),
       ('qtest-4444', NULL, 'QTestStudy1', 'investigator'),
       ('qtest-5555', NULL, 'QTestStudy3', 'investigator');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudy1', 'pm1@example.com', 'write'),
       ('QTestStudy1', 'researcher1@example.com', 'write'),
       ('QTestStudy1', 'investigationteam1@example.com', 'write'),
       ('QTestStudy3', 'investigationteam1@example.com', 'write');
