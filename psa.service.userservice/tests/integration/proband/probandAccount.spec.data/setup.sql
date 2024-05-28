/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('QTestStudy1');

INSERT INTO probands (pseudonym, ids, study, origin)
VALUES ('qtest-proband1', NULL, 'QTestStudy1', 'investigator');

INSERT INTO lab_results (id, user_id, order_id, status, remark, new_samples_sent, performing_doctor, study_status)
VALUES ('QTEST_11111', 'qtest-proband1', 1, 'analyzed', 'my remark comment', FALSE, 'dr who', 'active'),
    ('QTEST_11112', 'qtest-proband1', 1, 'sampled', 'my remark comment', FALSE, 'dr who', 'active'),
    ('QTEST_11113', 'qtest-proband1', 1, 'new', 'my remark comment', FALSE, 'dr who', 'active');
INSERT INTO lab_observations (id, lab_result_id, name_id)
VALUES (123456, 'QTEST_11111', 0),
       (123457, 'QTEST_11111', 1);
INSERT INTO blood_samples (id, user_id, sample_id)
VALUES (123456, 'qtest-proband1', 'QTEST_1');

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (123456, 'QTestStudy1', 'QTestQuestionnaireName', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1', 'not_body1');
INSERT INTO questions (id, questionnaire_id, text, position)
VALUES (123456, 123456, 'question_text', 0);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (123456, 123456, 'subquestion_text1', 1, NULL, NULL, 0),
       (123457, 123456, 'subquestion_text2', 1, NULL, NULL, 1);
INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (123456, 'QTestStudy1', 123456, 'QTestQuestionnaireName', 'qtest-proband1', '2021-01-18T14:14:03.155+01:00',
        NULL, NULL, 0, 'active'),
       (123457, 'QTestStudy1', 123456, 'QTestQuestionnaireName', 'qtest-proband1', '2021-01-18T14:14:03.156+01:00',
        NULL, NULL, 1, 'active');
INSERT INTO questionnaire_instances_queued (user_id, questionnaire_instance_id, date_of_queue)
VALUES ('qtest-proband1', 123456, '2021-01-18T14:14:03.156+01:00'),
       ('qtest-proband1', 123457, '2021-01-18T14:14:03.156+01:00');
INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (123456, 123456, 123456, 1, 'some answer value'),
       (123457, 123456, 123456, 1, 11111);
INSERT INTO user_files (id, user_id, questionnaire_instance_id, answer_option_id, file)
VALUES (123456, 'qtest-proband1', 123456, 123456, 'somerandomimagebase64encodedstuff');

INSERT INTO notification_schedules (id, user_id, send_on, notification_type, reference_id, title, body)
VALUES (123456, 'qtest-proband1', '2021-01-18T14:14:03.156+01:00', 'qInstance', 123456, 'title', 'body');
