/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
INSERT INTO studies (name) VALUES ('QTestStudy');

INSERT INTO accounts (username, password, role)
VALUES ('QTestProband1', '', 'Proband'),
       ('QTestProband2', '', 'Proband'),
       ('QTestProband5', '', 'Proband'),
       ('QTestForscher1', '', 'Forscher'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestSystemAdmin', '', 'SysAdmin');

INSERT INTO probands (pseudonym, status, study)
VALUES ('QTestProband1', 'active', 'QTestStudy'),
       ('QTestProband2', 'active', 'QTestStudy'),
       ('QTestProband3', 'deactivated', 'QTestStudy'),
       ('QTestProband4', 'deleted', 'QTestStudy'),
       ('QTestProband5', 'active', 'QTestStudy');

INSERT INTO blood_samples(id, user_id, sample_id, blood_sample_carried_out, remark)
VALUES (99999, 'QTestProband1', 'ZIFCO-1234567899', TRUE, 'This is as simple comment'),
       (99998, 'QTestProband2', 'ZIFCO-1234567890', FALSE, 'This is another simple comment'),
       (99997, 'QTestProband3', 'ZIFCO-1234567891', FALSE, NULL),
       (99996, 'QTestProband4', 'ZIFCO-1234567892', FALSE, NULL),
       (99995, 'QTestProband5', 'ZIFCO-1234567898', FALSE, 'This is just a comment');
