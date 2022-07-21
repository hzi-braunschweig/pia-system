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

INSERT INTO probands (pseudonym, compliance_labresults, ids, study)
VALUES ('qtest-proband1', TRUE, NULL, 'QTestStudy1'),
       ('qtest-proband2', TRUE, NULL, 'QTestStudy2'),
       ('qtest-proband3', TRUE, NULL, 'QTestStudy2'),
       ('qtest-proband4', TRUE, 'test-ids-000', 'QTestStudy1'),
       ('qtest-ids1', TRUE, 'qtest-ids1', 'QTestStudy3'),
       ('qtest-ids2', TRUE, 'qtest-ids2', 'QTestStudy3');

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
VALUES ('pm1@example.com', 'pm2@example.com', 'qtest-proband4', TRUE, TRUE, TRUE, FALSE, TRUE, TRUE);

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
