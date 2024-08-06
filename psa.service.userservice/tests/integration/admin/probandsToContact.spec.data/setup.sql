/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('ApiTestStudie'),
       ('ApiTestStudie2'),
       ('ApiTestMultiProf');

INSERT INTO probands (pseudonym, ids, status, study, origin)
VALUES ('qtest-proband1', 'ids1', 'active', 'ApiTestStudie', 'investigator'),
       ('qtest-proband2', 'ids2', 'active', 'ApiTestStudie2', 'investigator'),
       ('qtest-proband3', 'ids3', 'deactivated', 'ApiTestStudie', 'investigator'),
       ('qtest-proband4', 'ids4', 'active', 'ApiTestStudie', 'investigator');

INSERT INTO users_to_contact(
        id,
        user_id,
        notable_answer_questionnaire_instances,
        is_notable_answer,
        is_notable_answer_at,
        not_filledout_questionnaire_instances,
        is_not_filledout,
        is_not_filledout_at,
        processed,
        processed_at)
VALUES (1, 'qtest-proband1', '{1000,1001,1002,1003}', false, NULL, '{}', true, '2021-05-20T09:34:22.762+02:00', true, '2021-05-20T09:34:22.762+02:00'),
       (2, 'qtest-proband2', '{2000,2001,2002}', true, '2021-05-20T09:34:22.762+02:00', '{2003}', false, NULL, true, '2021-05-20T09:34:22.762+02:00'),
       (3, 'qtest-proband3', '{3000,3001}', false, NULL, '{3002,3003}', true, '2021-05-20T09:34:22.762+02:00', false, NULL),
       (4, 'qtest-proband4', '{4000}', false, NULL, '{4001,4002,4003}', true, '2021-05-20T09:34:22.762+02:00', false, NULL);

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (123456, 'ApiTestStudie2', 'ApiQuestionnaireName2', 1, 0, 'once', 0, 0, 3, 'not_title', 'not_body1',
        'not_body1');

INSERT INTO questions (id, questionnaire_id, text, position)
VALUES (123456, 123456, 'question_text', 0);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (123456, 123456, 'subquestion_text1', 1, NULL, NULL, 0),
       (123457, 123456, 'subquestion_text2', 1, NULL, NULL, 1);

INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (2000, 'ApiTestStudie2', 123456, 'ApiQuestionnaireName1', 'qtest-proband2', '2021-01-04T10:18:30.825+01:00',
        NULL, NULL, 0, 'active'),
       (2001, 'ApiTestStudie2', 123456, 'ApiQuestionnaireName2', 'qtest-proband2', '2021-01-04T10:18:30.825+01:00',
        NULL, NULL, 0, 'active'),
       (2002, 'ApiTestStudie2', 123456, 'ApiQuestionnaireName3', 'qtest-proband2', '2021-01-04T10:18:30.825+01:00',
        NULL, NULL, 0, 'active'),
       (2003, 'ApiTestStudie2', 123456, 'ApiQuestionnaireName4', 'qtest-proband2', '2021-01-04T10:18:30.825+01:00',
        NULL, NULL, 0, 'active');
