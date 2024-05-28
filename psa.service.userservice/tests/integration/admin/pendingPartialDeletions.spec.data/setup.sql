/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('QTestStudie1'),
       ('QTestStudie2');

INSERT INTO probands (pseudonym, compliance_labresults, compliance_samples, compliance_bloodsamples, study, origin)
VALUES ('qtest-proband1', TRUE, TRUE, TRUE, 'QTestStudie1', 'investigator'),
       ('qtest-proband2', TRUE, TRUE, TRUE, 'QTestStudie2', 'investigator');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('QTestStudie1', 'forscher1@example.com', 'write'),
       ('QTestStudie1', 'forscher2@example.com', 'write'),
       ('QTestStudie1', 'qtest-forscher_no_email', 'write'),
       ('QTestStudie1', 'pm1@example.com', 'write'),
       ('QTestStudie1', 'ut1@example.com', 'write'),
       ('QTestStudie2', 'forscher4@example.com', 'write');

INSERT INTO lab_results (id, user_id)
VALUES ('APISAMPLE_11111', 'qtest-proband1'),
       ('APISAMPLE_11112', 'qtest-proband1'),
       ('APISAMPLE_11113', 'qtest-proband2');
INSERT INTO lab_observations (id, lab_result_id, name_id)
VALUES (123456, 'APISAMPLE_11111', 0),
       (123457, 'APISAMPLE_11111', 1),
       (123458, 'APISAMPLE_11112', 0),
       (123459, 'APISAMPLE_11112', 1);

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (123456, 'QTestStudie1', 'ApiQuestionnaireName1', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1',
        'not_body1'),
       (123457, 'QTestStudie2', 'ApiQuestionnaireName2', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1',
        'not_body1');
INSERT INTO questions (id, questionnaire_id, text, position)
VALUES (123456, 123456, 'question_text', 0),
       (123457, 123457, 'question_text', 0);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (123456, 123456, 'subquestion_text1', 1, NULL, NULL, 0),
       (123457, 123456, 'subquestion_text2', 1, NULL, NULL, 1),
       (123458, 123457, 'subquestion_text1', 1, NULL, NULL, 0),
       (123459, 123457, 'subquestion_text2', 1, NULL, NULL, 1);

INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (123456, 'QTestStudie1', 123456, 'ApiQuestionnaireName1', 'qtest-proband1', '2021-01-04T10:18:30.825+01:00',
        NULL, NULL, 0, 'active'),
       (123457, 'QTestStudie1', 123456, 'ApiQuestionnaireName1', 'qtest-proband1', '2021-01-04T10:18:30.825+01:00',
        NULL, NULL, 1, 'active'),
       (123458, 'QTestStudie1', 123457, 'ApiQuestionnaireName2', 'qtest-proband2', '2021-03-04T10:18:30.825+01:00',
        NULL, NULL, 0, 'active'),
       (123459, 'QTestStudie1', 123457, 'ApiQuestionnaireName2', 'qtest-proband2', '2021-03-04T10:18:30.825+01:00',
        NULL, NULL, 1, 'active');
INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (123456, 123456, 123456, 1, 'some answer value'),
       (123457, 123456, 123456, 1, 11111);
INSERT INTO user_files (id, user_id, questionnaire_instance_id, answer_option_id, file)
VALUES (123456, 'qtest-proband1', 123456, 123456, 'somerandomimagebase64encodedstuff');
INSERT INTO questionnaire_instances_queued (user_id, questionnaire_instance_id, date_of_queue)
VALUES ('qtest-proband1', 123456, '2021-03-04T15:45:16.409+01:00'),
       ('qtest-proband1', 123457, '2021-03-04T15:45:16.409+01:00');

INSERT INTO pending_partial_deletions (id, requested_by, requested_for, proband_id, from_date, to_date,
                                       for_instance_ids, for_lab_results_ids)
VALUES (1234560, 'forscher1@example.com', 'forscher2@example.com', 'qtest-proband1', '2021-01-01T01:00:00.000Z',
        '2021-01-31T23:00:00.000Z', ARRAY [123456,123457], ARRAY ['APISAMPLE_11111','APISAMPLE_11112']),
       (1234561, 'forscher1@example.com', 'forscher2@example.com', 'qtest-proband1', '2021-02-22T12:51:52.014+01:00',
        '2021-03-04T12:51:52.018+01:00', ARRAY [123456,123457], NULL),
       (1234562, 'forscher1@example.com', 'forscher2@example.com', 'qtest-proband1', '2021-02-22T12:51:52.014+01:00',
        '2021-03-04T12:51:52.018+01:00', NULL, ARRAY ['APISAMPLE_11111','APISAMPLE_11112']);
