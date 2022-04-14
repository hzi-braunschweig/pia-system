/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name, has_total_opposition, has_four_eyes_opposition)
VALUES ('ApiTestStudie1', TRUE, TRUE),
       ('ApiTestStudie2', FALSE, TRUE),
       ('ApiTestStudie3', TRUE, FALSE);

INSERT INTO accounts (username, password, role)
VALUES ('ApiTestProband1', '', 'Proband'),
       ('ApiTestProband2', '', 'Proband'),
       ('ApiTestProband3', '', 'Proband'),
       ('ApiTestProband4', '', 'Proband'),

       ('forscher1@apitest.de', '', 'Forscher'),
       ('forscher2@apitest.de', '', 'Forscher'),
       ('ut1@apitest.de', '', 'Untersuchungsteam'),
       ('ut2@apitest.de', '', 'Untersuchungsteam'),
       ('pm1@apitest.de', '', 'ProbandenManager'),
       ('pm2@apitest.de', '', 'ProbandenManager'),
       ('pmNoEmail', '', 'ProbandenManager'),
       ('pm4@apitest.de', '', 'ProbandenManager'),
       ('pm5@apitest.de', '', 'ProbandenManager'),
       ('sa1@apitest.de', '', 'SysAdmin'),
       ('sa2@apitest.de', '', 'SysAdmin'),
       ('sa3@apitest.de', '', 'SysAdmin'); 

INSERT INTO probands (pseudonym, compliance_labresults, compliance_samples, compliance_bloodsamples, study)
VALUES ('ApiTestProband1', TRUE, TRUE, TRUE, 'ApiTestStudie1'),
       ('ApiTestProband2', TRUE, TRUE, TRUE, 'ApiTestStudie1'),
       ('ApiTestProband3', TRUE, TRUE, TRUE, 'ApiTestStudie3'),
       ('ApiTestProband4', TRUE, TRUE, TRUE, 'ApiTestStudie1');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie1', 'forscher1@apitest.de', 'write'),
       ('ApiTestStudie1', 'forscher2@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut1@apitest.de', 'write'),
       ('ApiTestStudie1', 'ut2@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm1@apitest.de', 'write'),
       ('ApiTestStudie1', 'pm2@apitest.de', 'write'),
       ('ApiTestStudie1', 'pmNoEmail', 'write'),
       ('ApiTestStudie2', 'pm4@apitest.de', 'write'),
       ('ApiTestStudie2', 'pm5@apitest.de', 'write'),
       ('ApiTestStudie3', 'pm4@apitest.de', 'write'),
       ('ApiTestStudie3', 'pm5@apitest.de', 'write');

INSERT INTO pending_deletions (id, requested_by, requested_for, type, for_id)
VALUES (1234560, 'pm1@apitest.de', 'pm2@apitest.de', 'proband', 'ApiTestProband2'),
       (1234561, 'pmNoEmail', 'pm2@apitest.de', 'proband', 'ApiTestProband1'),
       (1234562, 'pm1@apitest.de', 'pm2@apitest.de', 'sample', 'APISAMPLE_11111'),
       (1234565, 'sa1@apitest.de', 'sa2@apitest.de', 'study', 'ApiTestStudie1');

INSERT INTO planned_probands (user_id, password, activated_at)
VALUES ('ApiPlannedTestName1', 'somerandompw', NULL),
       ('ApiPlannedTestName2', 'somerandompw', NULL);
INSERT INTO study_planned_probands (study_id, user_id)
VALUES ('ApiTestStudie1', 'ApiPlannedTestName1'),
       ('ApiTestStudie1', 'ApiPlannedTestName2');
INSERT INTO lab_results (id, user_id, order_id, status, remark, new_samples_sent, performing_doctor, study_status)
VALUES ('APISAMPLE_11111', 'ApiTestProband2', 1, 'analyzed', 'my remark comment', FALSE, 'dr who', 'active'),
       ('APISAMPLE_11112', 'ApiTestProband3', 1, 'sampled', 'my remark comment', FALSE, 'dr who', 'active'),
       ('APISAMPLE_11113', 'ApiTestProband1', 1, 'new', 'my remark comment', FALSE, 'dr who', 'active');
INSERT INTO lab_observations (id, lab_result_id, name_id)
VALUES (123456, 'APISAMPLE_11111', 0),
       (123457, 'APISAMPLE_11111', 1);
INSERT INTO blood_samples (id, user_id, sample_id)
VALUES (123456, 'ApiTestProband1', 'APIBloodSample1');
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
VALUES (123456, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName', 'ApiTestProband1', '2021-01-18T14:14:03.155+01:00',
        NULL, NULL, 0, 'active'),
       (123457, 'ApiTestStudie1', 123456, 'ApiQuestionnaireName', 'ApiTestProband1', '2021-01-18T14:14:03.156+01:00',
        NULL, NULL, 1, 'active');
INSERT INTO questionnaire_instances_queued (user_id, questionnaire_instance_id, date_of_queue)
VALUES ('ApiTestProband1', 123456, '2021-01-18T14:14:03.156+01:00'),
       ('ApiTestProband1', 123457, '2021-01-18T14:14:03.156+01:00');
INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (123456, 123456, 123456, 1, 'some answer value'),
       (123457, 123456, 123456, 1, 11111);
INSERT INTO user_files (id, user_id, questionnaire_instance_id, answer_option_id, file)
VALUES (123456, 'ApiTestProband1', 123456, 123456, 'somerandomimagebase64encodedstuff');
INSERT INTO notification_schedules (id, user_id, send_on, notification_type, reference_id, title, body)
VALUES (123456, 'ApiTestProband1', '2021-01-18T14:14:03.156+01:00', 'qInstance', 123456, 'title', 'body'),
       (123457, 'ApiTestProband1', '2021-01-18T14:14:03.156+01:00', 'sample', 'APISAMPLE_11111', 'title', 'body');
