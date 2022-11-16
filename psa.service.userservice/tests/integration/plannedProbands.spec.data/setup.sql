/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('ApiTestStudie'),
       ('ApiTestStudie2'),
       ('ApiTestMultiProband'),
       ('ApiTestMultiProf');

INSERT INTO probands(pseudonym, first_logged_in_at, study, origin)
VALUES ('qtest-proband1', '2021-05-20T09:34:22.760+02:00', 'ApiTestStudie', 'investigator'),
       ('qtest-proband2', NULL, 'ApiTestStudie2', 'investigator');

INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'qtest-forscher1', 'write'),
       ('ApiTestStudie2', 'qtest-forscher1', 'write'),
       ('ApiTestStudie2', 'qtest-forscher2', 'write'),
       ('ApiTestStudie', 'ut@apitest.de', 'write'),
       ('ApiTestStudie2', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie', 'qtest-probandenmanager', 'write'),
       ('ApiTestMultiProf', 'qtest-forscher1', 'write'),
       ('ApiTestMultiProf', 'qtest-forscher2', 'write'),
       ('ApiTestMultiProf', 'ut@apitest.de', 'write'),
       ('ApiTestMultiProf', 'qtest-probandenmanager', 'write');

INSERT INTO planned_probands(user_id, password, activated_at)
VALUES ('planned1', 'aPassword1', '2021-05-20T09:34:22.762+02:00'),
       ('planned2', 'aPassword2', NULL),
       ('planned3', 'aPassword3', '2021-05-20T09:34:22.762+02:00');
INSERT INTO study_planned_probands(study_id, user_id)
VALUES ('ApiTestStudie', 'planned1'),
       ('ApiTestStudie', 'planned2'),
       ('ApiTestMultiProband', 'planned1'),
       ('ApiTestMultiProband', 'planned3');
