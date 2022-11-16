/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies(name)
VALUES ('QTestStudy1'),
       ('QTestStudy2');

INSERT INTO probands(pseudonym, ids, study, origin)
VALUES ('qtest-proband1', NULL, 'QTestStudy1', 'investigator'),
       ('qtest-deleteme', '53ae2aea-67bc-4365-9d63-8acdc275d98c', 'QTestStudy2', 'investigator'),
       ('qtest-deleteme_fully', NULL, 'QTestStudy2', 'investigator');

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (123456, 'QTestStudy1', 'ApiQuestionnaireName1', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1', 'not_body1');

INSERT INTO questions (id, questionnaire_id, text, position)
VALUES (123456, 123456, 'question_text', 0);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (123456, 123456, 'subquestion_text1', 1, NULL, NULL, 0),
       (123457, 123456, 'subquestion_text2', 1, NULL, NULL, 1);

INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue, cycle,
                                     status)
VALUES (123456, 'QTestStudy1', 123456, 'ApiQuestionnaireName1', 'qtest-proband1', NOW(), 0, 'active'),
       (123457, 'QTestStudy1', 123456, 'ApiQuestionnaireName1', 'qtest-proband1', NOW(), 1, 'active');

INSERT INTO lab_results (id, user_id)
VALUES ('APISAMPLE_11111', 'qtest-proband1');
