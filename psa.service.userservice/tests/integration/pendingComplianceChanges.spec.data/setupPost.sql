/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('ApiTestStudie1'),
       ('ApiTestStudie2');

INSERT INTO probands (pseudonym, compliance_labresults, compliance_samples, compliance_bloodsamples, study, origin)
VALUES ('qtest-api-proband1', TRUE, TRUE, TRUE, 'ApiTestStudie1', 'investigator'),
       ('qtest-api-proband2', TRUE, TRUE, TRUE, 'ApiTestStudie2', 'investigator'),
       ('qtest-api-proband3', TRUE, TRUE, TRUE, 'ApiTestStudie1', 'investigator');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie1', 'forscher1@apitest.de', 'write'),
       ('ApiTestStudie1', 'forscher2@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut1@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm1@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm2@apitest.de', 'write'),
       ('ApiTestStudie1', 'qtest-pm_no_email', 'write'),
       ('ApiTestStudie2', 'pm4@apitest.de', 'write');

INSERT INTO pending_compliance_changes (id, requested_by, requested_for, proband_id, compliance_labresults_from,
                                        compliance_labresults_to, compliance_samples_from, compliance_samples_to,
                                        compliance_bloodsamples_from, compliance_bloodsamples_to)
VALUES (1234560, 'pm1@apitest.de', 'pm2@apitest.de', 'qtest-api-proband3', FALSE, TRUE, FALSE, TRUE, FALSE, TRUE);
