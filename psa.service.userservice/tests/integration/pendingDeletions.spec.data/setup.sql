/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name, has_total_opposition, has_four_eyes_opposition)
VALUES ('ApiTestStudie1', TRUE, TRUE),
       ('ApiTestStudie2', FALSE, TRUE),
       ('ApiTestStudie3', TRUE, FALSE);

INSERT INTO probands (pseudonym, compliance_labresults, compliance_samples, compliance_bloodsamples, study)
VALUES ('qtest-api-proband1', TRUE, TRUE, TRUE, 'ApiTestStudie1'),
       ('qtest-api-proband2', TRUE, TRUE, TRUE, 'ApiTestStudie1'),
       ('qtest-api-proband3', TRUE, TRUE, TRUE, 'ApiTestStudie3'),
       ('qtest-api-proband4', TRUE, TRUE, TRUE, 'ApiTestStudie1');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie1', 'forscher1@apitest.de', 'write'),
       ('ApiTestStudie1', 'forscher2@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut1@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm1@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm2@apitest.de', 'write'),
       ('ApiTestStudie1', 'qtest-pm_no_email', 'write'),
       ('ApiTestStudie2', 'pm4@apitest.de', 'write'),
       ('ApiTestStudie2', 'pm5@apitest.de', 'write'),
       ('ApiTestStudie3', 'pm4@apitest.de', 'write'),
       ('ApiTestStudie3', 'pm5@apitest.de', 'write');

INSERT INTO pending_deletions (id, requested_by, requested_for, type, for_id)
VALUES (1234560, 'pm1@apitest.de', 'pm2@apitest.de', 'proband', 'qtest-api-proband2'),
       (1234561, 'qtest-pm_no_email', 'pm2@apitest.de', 'proband', 'qtest-api-proband1'),
       (1234562, 'pm1@apitest.de', 'pm2@apitest.de', 'sample', 'APISAMPLE_11111'),
       (1234565, 'sa1@apitest.de', 'sa2@apitest.de', 'study', 'ApiTestStudie1');

INSERT INTO planned_probands (user_id, password, activated_at)
VALUES ('qtest-planned1', 'somerandompw', NULL),
       ('qtest-planned2', 'somerandompw', NULL);
INSERT INTO study_planned_probands (study_id, user_id)
VALUES ('ApiTestStudie1', 'qtest-planned1'),
       ('ApiTestStudie1', 'qtest-planned2');
INSERT INTO lab_results (id, user_id, order_id, status, remark, new_samples_sent, performing_doctor, study_status)
VALUES ('APISAMPLE_11111', 'qtest-api-proband2', 1, 'analyzed', 'my remark comment', FALSE, 'dr who', 'active'),
       ('APISAMPLE_11112', 'qtest-api-proband3', 1, 'sampled', 'my remark comment', FALSE, 'dr who', 'active'),
       ('APISAMPLE_11113', 'qtest-api-proband1', 1, 'new', 'my remark comment', FALSE, 'dr who', 'active');
INSERT INTO lab_observations (id, lab_result_id, name_id)
VALUES (123456, 'APISAMPLE_11111', 0),
       (123457, 'APISAMPLE_11111', 1);
INSERT INTO blood_samples (id, user_id, sample_id)
VALUES (123456, 'qtest-api-proband1', 'APIBloodSample1');
INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (123456, 'ApiTestStudie1', 'ApiQuestionnaireName', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1', 'not_body1');
INSERT INTO questions (id, questionnaire_id, text, position)
VALUES (123456, 123456, 'question_text', 0);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (123456, 123456, 'subquestion_text1', 1, NULL, NULL, 0),
       (123457, 123456, 'subquestion_text2', 1, NULL, NULL, 1);
INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (123456, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName', 'qtest-api-proband1', '2021-01-18T14:14:03.155+01:00',
        NULL, NULL, 0, 'active'),
       (123457, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName', 'qtest-api-proband1', '2021-01-18T14:14:03.156+01:00',
        NULL, NULL, 1, 'active');
INSERT INTO questionnaire_instances_queued (user_id, questionnaire_instance_id, date_of_queue)
VALUES ('qtest-api-proband1', 123456, '2021-01-18T14:14:03.156+01:00'),
       ('qtest-api-proband1', 123457, '2021-01-18T14:14:03.156+01:00');
INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (123456, 123456, 123456, 1, 'some answer value'),
       (123457, 123456, 123456, 1, 11111);
INSERT INTO user_files (id, user_id, questionnaire_instance_id, answer_option_id, file)
VALUES (123456, 'qtest-api-proband1', 123456, 123456, 'somerandomimagebase64encodedstuff');
INSERT INTO notification_schedules (id, user_id, send_on, notification_type, reference_id, title, body)
VALUES (123456, 'qtest-api-proband1', '2021-01-18T14:14:03.156+01:00', 'qInstance', 123456, 'title', 'body'),
       (123457, 'qtest-api-proband1', '2021-01-18T14:14:03.156+01:00', 'sample', 'APISAMPLE_11111', 'title', 'body');
