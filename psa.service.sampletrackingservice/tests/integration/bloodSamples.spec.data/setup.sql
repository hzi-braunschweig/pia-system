/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
INSERT INTO studies (name) VALUES ('QTestStudy');

INSERT INTO probands (pseudonym, status, study)
VALUES ('qtest-proband1', 'active', 'QTestStudy'),
       ('qtest-proband2', 'active', 'QTestStudy'),
       ('qtest-proband3', 'deactivated', 'QTestStudy'),
       ('qtest-proband4', 'deleted', 'QTestStudy'),
       ('qtest-proband5', 'active', 'QTestStudy');

INSERT INTO blood_samples(id, user_id, sample_id, blood_sample_carried_out, remark)
VALUES (99999, 'qtest-proband1', 'ZIFCO-1234567899', TRUE, 'This is as simple comment'),
       (99998, 'qtest-proband2', 'ZIFCO-1234567890', FALSE, 'This is another simple comment'),
       (99997, 'qtest-proband3', 'ZIFCO-1234567891', FALSE, NULL),
       (99996, 'qtest-proband4', 'ZIFCO-1234567892', FALSE, NULL),
       (99995, 'qtest-proband5', 'ZIFCO-1234567898', FALSE, 'This is just a comment');
