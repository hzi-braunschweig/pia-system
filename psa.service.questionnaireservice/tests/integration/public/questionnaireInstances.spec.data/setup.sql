/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

--
-- Users and Studies
--
INSERT INTO studies (name)
VALUES ('Study A'),
       ('Study B'),
       ('Study X');

INSERT INTO probands (pseudonym, ids, study)
VALUES ('stya-0000000001', NULL, 'Study A'),
       ('stya-0000000002', NULL, 'Study A'),
       ('styb-0000000001', NULL, 'Study B'),
       ('styx-0000000001', NULL, 'Study X');

--
-- Questionnaires
--
INSERT INTO questionnaires (id, study_id, name, custom_name, no_questions, cycle_amount, cycle_unit,
                            activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed, expires_after_days,
                            finalises_after_days, created_at, type, version, publish, notify_when_not_filled,
                            notify_when_not_filled_time, notify_when_not_filled_day, cycle_per_day, cycle_first_hour,
                            keep_answers)

VALUES (100, 'Study A', 'Questionnaire A', 'questionnaire_a', 2, 1, 'once', 0, 1, 0, '', '', '', '', 0, '',
        NULL, FALSE, 1, 1, '2024-01-19', 'for_research_team', 1, 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
       (110, 'Study A', 'Questionnaire B', 'questionnaire_b', 2, 1, 'once', 0, 1, 0, '', '', '', '', 0, '',
        NULL, FALSE, 1, 1, '2024-01-19', 'for_research_team', 1, 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
       (200, 'Study B', 'Questionnaire A', 'questionnaire_a', 2, 1, 'once', 0, 1, 0, '', '', '', '', 0, '',
        NULL, FALSE, 1,
        1, '2024-01-19', 'for_research_team', 1, 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
       (300, 'Study X', 'Questionnaire X', 'questionnaire_a', 2, 1, 'once', 0, 1, 0, '', '', '', '', 0, '',
        NULL, FALSE, 1,
        1, '2024-01-19', 'for_research_team', 1, 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE);

INSERT INTO questions (id, questionnaire_id, text, "position", is_mandatory, variable_name, questionnaire_version)
VALUES
    -- Study A | Questionnaire A
    (100100, 100, 'Question #1', 1, TRUE, 'question_1', 1),
    (100200, 100, 'Question #2', 2, FALSE, 'question_2', 1),
    (100300, 100, 'Question #3', 3, FALSE, 'question_3', 1),
    -- Study A | Questionnaire B
    (110100, 110, 'Question #1', 1, FALSE, 'not_mandatory', 1),
    -- Study B | Questionnaire A
    (200100, 200, 'Question #1', 1, TRUE, 'question_1', 1),
    (200200, 200, 'Question #2', 2, TRUE, 'question_2', 1),
    -- Study X | Questionnaire X
    (300100, 300, 'Question #1', 1, TRUE, 'question_1', 1);

INSERT INTO answer_options (id, question_id, text, answer_type_id, is_notable, "values", values_code, "position",
                            is_decimal, restriction_min, restriction_max, variable_name)
VALUES
    -- Study A | Questionnaire A | Question #1
    (1001001, 100100, 'Single Choice', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, 'answer_option_1'),
    (1001002, 100100, 'Multiple Choice - can trigger question_3', 2, '{f,f,f}', '{"Keine Angabe",Ja,Nein}', '{99,1,0}',
     2, FALSE, NULL, NULL,
     'answer_option_2'),
    (1001003, 100100, 'Zahlen', 3, '{}', '{}', '{}', 3, TRUE, 1, 10, 'answer_option_3'),
    (1001004, 100100, 'Text', 4, '{}', '{}', '{}', 4, FALSE, NULL, NULL, 'answer_option_4'),
    (1001005, 100100, 'Date', 5, '{}', '{}', '{}', 5, FALSE, -7, 7, 'answer_option_5'),
    -- Study A | Questionnaire A | Question #2
    (1001006, 100200, 'Single Choice - can triggered answer_option_11', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 6,
     FALSE, NULL, NULL, 'answer_option_6'),
    (1001007, 100200, 'Upload', 8, '{}', '{}', '{}', 7, FALSE, NULL, NULL, 'answer_option_7'),
    (1001008, 100200, 'Sample ID', 6, '{}', '{}', '{}', 8, FALSE, NULL, NULL, 'answer_option_8'),
    (1001009, 100200, 'PZN', 7, '{}', '{}', '{}', 9, FALSE, NULL, NULL, 'answer_option_9'),
    (1001010, 100200, 'Timestamp', 9, '{}', '{}', '{}', 10, FALSE, NULL, NULL, 'answer_option_10'),
    (1001011, 100200, 'Text input - triggered by answer_option_6', 4, '{}', '{}', '{}', 11,
     FALSE, NULL, NULL,
     'answer_option_11'),
    -- Study A | Questionnaire A | Question #3
    (1001012, 100300, 'Text input - shown by answer_option_2 via question_3', 4, '{}', '{}', '{}', 12, FALSE, NULL,
     NULL,
     'answer_option_12'),
    -- Study A | Questionnaire B | Question not mandatory
    (1101001, 110100, 'Single Choice', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, 'answer_option_1'),
    -- Study B | Questionnaire A | Question #1
    (2001001, 200100, 'Single Choice', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, 'answer_option_1'),
    (2001002, 200100, 'Multiple Choice', 2, '{f,f,f}', '{"Keine Angabe",Ja,Nein}', '{99,1,0}', 2, FALSE, NULL, NULL,
     'answer_option_2'),
    (2001003, 200100, 'Zahlen', 3, '{}', '{}', '{}', 3, FALSE, NULL, NULL, 'answer_option_3'),
    (2001004, 200100, 'Text', 4, '{}', '{}', '{}', 4, FALSE, NULL, NULL, 'answer_option_4'),
    (2001005, 200100, 'Date', 5, '{}', '{}', '{}', 5, FALSE, NULL, NULL, 'answer_option_5'),
    -- Study B | Questionnaire A | Question #2
    (2002006, 200200, 'Single Choice triggering additional question', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 6,
     FALSE, NULL, NULL, 'answer_option_6'),
    (2002007, 200200, 'Upload', 8, '{}', '{}', '{}', 7, FALSE, NULL, NULL, 'answer_option_7'),
    (2002008, 200200, 'Sample ID', 6, '{}', '{}', '{}', 8, FALSE, NULL, NULL, 'answer_option_8'),
    (2002009, 200200, 'PZN', 7, '{}', '{}', '{}', 9, FALSE, NULL, NULL, 'answer_option_9'),
    (2002010, 200200, 'Timestamp', 9, '{}', '{}', '{}', 10, FALSE, NULL, NULL, 'answer_option_10')
;

--
-- Conditions
--
INSERT INTO conditions (condition_type, condition_answer_option_id, condition_question_id, condition_questionnaire_id,
                        condition_operand, condition_value, condition_target_answer_option,
                        condition_target_questionnaire, condition_link, condition_questionnaire_version,
                        condition_target_questionnaire_version)
VALUES ('internal_this', 1001011, null, null, '==', 'Ja', 1001006, 100, 'AND', 1, 1),
       ('internal_this', null, 100300, null, '==', 'Ja;Nein', 1001002, 100, 'AND', 1, 1);

INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status, notifications_scheduled,
                                     progress, release_version, questionnaire_version)
VALUES
    -- Study A | stya-0000000001 | Questionnaire A
    (100100, 'Study A', 100, 'Questionnaire A', 'stya-0000000001', '2024-01-19 07:00:00.000000',
     NULL, NULL, 1, 'active', FALSE, 0, 0, 1),
    -- Study A | styb-0000000001 | Questionnaire A
    (100101, 'Study A', 100, 'Questionnaire A', 'styb-0000000001', '2024-01-19 07:00:00.000000',
     NULL, NULL, 1, 'in_progress', FALSE, 60, 0, 1),
    -- Study A | stya-0000000002 | Questionnaire A
    (100102, 'Study A', 100, 'Questionnaire A', 'stya-0000000002', '2024-02-19 07:00:00.000000',
     NULL, NULL, 1, 'active', FALSE, 0, 0, 1),
    -- Study A | styb-0000000001 | Questionnaire B
    (110100, 'Study A', 110, 'Questionnaire B', 'styb-0000000001', '2024-02-20 17:00:00.000000',
     '2024-02-22T11:00:00.0000000', NULL, 1, 'released_once', FALSE, 100, 1, 1),
    -- Study A | stya-0000000001 | Questionnaire B
    (110101, 'Study A', 110, 'Questionnaire B', 'stya-0000000001', '2024-01-19 07:00:00.000000',
     NULL, NULL, 1, 'in_progress', FALSE, 60, 0, 1),
    -- Study B | styb-0000000001 | Questionnaire A
    (200100, 'Study B', 200, 'Questionnaire A', 'styb-0000000001', '2024-01-19 07:00:00.000000',
     NULL, NULL, 1, 'in_progress', FALSE, 60, 0, 1),
    (200101, 'Study B', 200, 'Questionnaire A', 'styb-0000000001', '2024-01-19 07:00:00.000000',
     '2024-02-22T11:00:00.0000000', NULL, 1, 'released_once', FALSE, 80, 0, 1)
;

INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value, date_of_release,
                     releasing_person)
VALUES
    -- Study A | Questionnaire B | Question not mandatory
    (110101, 110100, 1101001, 1, 'Ja', NULL, NULL),
    (110101, 110100, 1101001, 2, 'Nein', NULL, NULL),
    (110101, 110100, 1101001, 3, 'Ja', NULL, NULL),

    -- Study B | Questionnaire A | Question #1
    (200100, 200100, 2001001, 1, 'Ja', NULL, NULL),
    (200100, 200100, 2001002, 1, 'Nein;Ja;', NULL, NULL),
    (200100, 200100, 2001003, 1, '49', NULL, NULL),
    (200100, 200100, 2001004, 1, 'Freitext', NULL, NULL),
    (200100, 200100, 2001005, 1, '2021-10-11T12:13:14.150Z', NULL, NULL),
    (200100, 200200, 2002006, 1, 'Ja', NULL, NULL),
    (200100, 200200, 2002007, 1, '', NULL, NULL), -- keep empty to get a progress of 80%
    (200100, 200200, 2002008, 1, '', NULL, NULL), -- keep empty to get a progress of 80%
    (200100, 200200, 2002009, 1, 'PZN-5678', NULL, NULL),
    (200100, 200200, 2002010, 1, '1623165077219', NULL, NULL) -- 2021-06-08T15:11:17+00:00
;