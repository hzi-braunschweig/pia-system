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

INSERT INTO accounts(username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),

       ('QTestForscher1', '', 'Forscher'),
       ('QTestForscher2', '', 'Forscher'),
       ('ut@apitest.de', '', 'Untersuchungsteam'),
       ('ut2@apitest.de', '', 'Untersuchungsteam'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestSystemAdmin', '', 'SysAdmin');

INSERT INTO probands(pseudonym, first_logged_in_at, study)
VALUES ('QTestProband1', '2021-05-20T09:34:22.760+02:00', 'ApiTestStudie'),
       ('QTestProband2', NULL, 'ApiTestStudie2');

INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'QTestForscher1', 'write'),
       ('ApiTestStudie2', 'QTestForscher1', 'write'),
       ('ApiTestStudie2', 'QTestForscher2', 'write'),
       ('ApiTestStudie', 'ut@apitest.de', 'write'),
       ('ApiTestStudie2', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie', 'QTestProbandenManager', 'write'),
       ('ApiTestMultiProf', 'QTestForscher1', 'write'),
       ('ApiTestMultiProf', 'QTestForscher2', 'write'),
       ('ApiTestMultiProf', 'ut@apitest.de', 'write'),
       ('ApiTestMultiProf', 'QTestProbandenManager', 'write');

INSERT INTO planned_probands(user_id, password, activated_at)
VALUES ('planned1', 'aPassword1', '2021-05-20T09:34:22.762+02:00'),
       ('planned2', 'aPassword2', NULL),
       ('planned3', 'aPassword3', '2021-05-20T09:34:22.762+02:00');
INSERT INTO study_planned_probands(study_id, user_id)
VALUES ('ApiTestStudie', 'planned1'),
       ('ApiTestStudie', 'planned2'),
       ('ApiTestMultiProband', 'planned1'),
       ('ApiTestMultiProband', 'planned3');
