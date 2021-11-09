/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO users(username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),
       ('QTestForscher1', '', 'Forscher'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin', '', 'SysAdmin');
INSERT INTO studies(name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung]'),
       ('ApiTestStudie2', 'ApiTestStudie2 Beschreibung]'),
       ('ApiTestMultiProband', 'ApiTestMultiProband Beschreibung'),
       ('ApiTestMultiProf', 'ApiTestMultiProf Beschreibung');
INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie2', 'QTestProband2', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'read'),
       ('ApiTestStudie', 'QTestProbandenManager', 'read'),
       ('ApiTestStudie', 'QTestUntersuchungsteam', 'read'),
       ('ApiTestMultiProband', 'QTestProband1', 'read'),
       ('ApiTestMultiProband', 'QTestProband2', 'read'),
       ('ApiTestMultiProf', 'QTestForscher1', 'read'),
       ('ApiTestMultiProf', 'QTestProbandenManager', 'read'),
       ('ApiTestMultiProf', 'QTestUntersuchungsteam', 'read');
INSERT INTO blood_samples(id, user_id, sample_id, blood_sample_carried_out, remark)
VALUES (99999, 'QTestProband1', 'ZIFCO-1234567899', TRUE, 'This is as simple comment'),
       (99998, 'QTestProband2', 'ZIFCO-1234567890', FALSE, 'This is another simple comment');
