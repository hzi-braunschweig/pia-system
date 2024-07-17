/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('QTestStudy1'),
       ('QTestStudy2'),

INSERT INTO probands (pseudonym, ids, study, origin)
VALUES ('qtest-proband1', NULL, 'QTestStudy1', 'investigator'),
       ('qtest-proband2', NULL, 'QTestStudy2', 'investigator'),
       ('qtest-proband3', NULL, 'QTestStudy2', 'investigator'),

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudy1', 'pm1@example.com', 'write'),
       ('QTestStudy1', 'researcher1@example.com', 'write'),
       ('QTestStudy1', 'forscher1@example.com', 'write'),
       ('QTestStudy1', 'ew1@example.com', 'write'),
       ('QTestStudy1', 'ut1@example.com', 'write'),

