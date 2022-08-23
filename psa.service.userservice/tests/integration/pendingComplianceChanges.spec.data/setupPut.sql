/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('ApiTestStudie1'),
       ('ApiTestStudie2');

INSERT INTO probands (pseudonym, compliance_labresults, compliance_samples, compliance_bloodsamples, study)
VALUES ('qtest-api-proband1', TRUE, TRUE, TRUE, 'ApiTestStudie1'),
       ('qtest-api-proband2', TRUE, TRUE, TRUE, 'ApiTestStudie2');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie1', 'forscher1@apitest.de', 'write'),
       ('ApiTestStudie1', 'forscher2@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut1@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm1@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm2@apitest.de', 'write'),
       ('ApiTestStudie1', 'qtest-pm_no_email', 'write'),
       ('ApiTestStudie2', 'pm4@apitest.de', 'write');

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed)
VALUES (123456, 'ApiTestStudie1', 'ApiQuestionnaireName1', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1', 'not_body1',
        NULL, NULL, NULL, NULL, TRUE),
       (123457, 'ApiTestStudie1', 'ApiQuestionnaireName2', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1', 'not_body1',
        NULL, NULL, NULL, NULL, FALSE);
INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (123456, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName1', 'qtest-api-proband1', '2021-10-13T08:43:23.067+02:00',
        NULL, NULL, 0, 'active'),
       (123457, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName1', 'qtest-api-proband1', '2021-10-13T08:43:23.068+02:00',
        NULL, NULL, 1, 'inactive'),
       (123458, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName1', 'qtest-api-proband1', '2021-10-13T08:43:23.068+02:00',
        NULL, NULL, 1, 'expired'),
       (123459, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName1', 'qtest-api-proband1', '2021-10-13T08:43:23.068+02:00',
        NULL, NULL, 1, 'released_once'),
       (123460, 'ApiTestStudie1', 123457, 'ApiQuestionnaireName2', 'qtest-api-proband1', '2021-10-13T08:43:23.068+02:00',
        NULL, NULL, 1, 'active');
INSERT INTO pending_compliance_changes (id, requested_by, requested_for, proband_id, compliance_labresults_from,
                                        compliance_labresults_to, compliance_samples_from, compliance_samples_to,
                                        compliance_bloodsamples_from, compliance_bloodsamples_to)
VALUES (1234560, 'pm1@apitest.de', 'pm2@apitest.de', 'qtest-api-proband1', TRUE, FALSE, TRUE, FALSE, TRUE, TRUE),
       (1234561, 'pm1@apitest.de', 'pm2@apitest.de', 'qtest-api-proband1', TRUE, FALSE, TRUE, TRUE, TRUE, TRUE);
