/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name, description, pm_email, hub_email, status, address, has_rna_samples, sample_prefix,
                     sample_suffix_length, has_answers_notify_feature, has_answers_notify_feature_by_mail,
                     has_four_eyes_opposition, has_partial_opposition, has_total_opposition, has_compliance_opposition,
                     has_logging_opt_in, pseudonym_prefix, pseudonym_suffix_length)
VALUES ('Answers Export', 'Testing answers export', NULL, NULL,
        'active', NULL, FALSE, 'ANSW', 2, FALSE, FALSE, FALSE, TRUE, TRUE, TRUE, FALSE, NULL, NULL);

INSERT INTO probands (pseudonym, first_logged_in_at, compliance_labresults, compliance_samples, needs_material,
                      study_center, examination_wave, compliance_bloodsamples, status, logging_active, study,
                      is_test_proband)
VALUES ('answ-01', '2021-06-08', TRUE, TRUE, TRUE, '-', 1, TRUE, 'active', TRUE, 'Answers Export', FALSE),
       ('answ-02', '2021-06-08', TRUE, TRUE, TRUE, '-', 1, TRUE, 'active', TRUE, 'Answers Export', TRUE),
       ('answ-03', '2021-06-08', TRUE, TRUE, TRUE, '-', 1, TRUE, 'active', TRUE, 'Answers Export', FALSE),
       ('answ-04', '2021-06-08', TRUE, TRUE, TRUE, '-', 1, TRUE, 'active', TRUE, 'Answers Export', FALSE),
       -- answ-99 is used to simulate a user which is not requested by the export request
       ('answ-99', '2021-06-08', TRUE, TRUE, TRUE, '.', 1, TRUE, 'active', TRUE, 'Answers Export', FALSE)
;

--
-- Every INSERT INTO in the following section is introduced by a description of how each ID is composed
--
-- Remember: Questionnaires which have new Versions KEEP their `id` but `version` is increased.
INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed, expires_after_days,
                            finalises_after_days, created_at, type, publish, notify_when_not_filled,
                            notify_when_not_filled_time, notify_when_not_filled_day, cycle_per_day, cycle_first_hour,
                            keep_answers)
VALUES
    -- This questionnaire is used to hold answers for condition testing ------------------------------------------------
    (900000, 1, 'Answers Export', 'Answers for conditions', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE1 v1 - without labels / no condition --------------------------------------------------------------------------
    (100000, 1, 'Answers Export', 'AE1 Answer Export', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE1 v2 - with labels / no condition -----------------------------------------------------------------------------
    (100000, 2, 'Answers Export', 'AE1 Answer Export', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE1 v3 - testing conditions on questionnaires -------------------------------------------------------------------
    (100000, 3, 'Answers Export', 'AE1 Answer Export', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE1 v4 - testing conditions on questions --------------------------------------------------------
    (100000, 4, 'Answers Export', 'AE1 Answer Export', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE1 v5 - testing conditions on answer options -----------------------------------------------------------------
    (100000, 5, 'Answers Export', 'AE1 Answer Export', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE1 v6 - testing conditions on answer options -----------------------------------------------------------------
    (100000, 6, 'Answers Export', 'AE1 Answer Export', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE2 v1 - testing if questionnaire versions without instances will not lead to empty exports ---------------------
    (200000, 1, 'Answers Export', 'AE2 Export without instance', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE),
    -- AE2 v2 ----------------------------------------------------------------------------------------------------------
    (200000, 2, 'Answers Export', 'AE2 Export with instance', 1, 1, 'once', 0, 1, 0, '', '', '', '', 0, '', NULL, FALSE,
     1, 1, '2021-06-08', 'for_probands', 'allaudiences', FALSE, NULL, NULL, NULL, NULL, FALSE)
;

-- id: [questionnaire]{1}[version]{1}[question]{1}
INSERT INTO questions (id, questionnaire_id, text, "position", is_mandatory, variable_name, questionnaire_version)
VALUES
    -- question for condition testing questionnaire
    (911000, 900000, 'Condition testing', 1, TRUE, 'condition_testing', 1),
    -- v1
    (111000, 100000, 'Without variable names', 1, FALSE, '', 1),
    -- v2
    (121000, 100000, 'With variable names', 1, FALSE, '', 2),
    -- v3 with condition on questionnaire
    (131000, 100000, 'Condition only on questionnaire', 1, FALSE, 'condition_question', 3),
    -- v4 conditions on questions
    (141000, 100000, 'Mandatory question to show or hide question 2', 2, TRUE, 'shows_hide_question', 4),
    (142000, 100000, 'Question with condition', 1, FALSE, 'condition_question_option', 4),
    -- v5 conditions on answer options
    (151000, 100000, 'Answer options to show or hide the following', 2, TRUE, 'conditional_answer_options', 5),
    -- v6 conditions on questions and answer options
    (161000, 100000, 'Cascading conditions on questions and answer options', 2, TRUE, 'conditional_questions_answer_options', 6),
    -- 2 v1
    (211000, 200000, 'Question', 1, FALSE, '', 1),
    -- 2 v2
    (221000, 200000, 'Question', 1, FALSE, '', 2)
;

-- id: [questionnaire]{1}[version]{1}[question]{1}[answer_option]{3}
INSERT INTO answer_options (id, question_id, text, answer_type_id, is_notable, "values", values_code, "position",
                            is_condition_target, restriction_min, restriction_max, is_decimal, variable_name)
VALUES
    -- answer options for condition testing
    (911001, 911000, 'An answer option for any condition', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE, ''),
    (911002, 911000, 'An answer option for a question condition', 2, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE, ''),
    (911003, 911000, 'An answer option for an answer option condition', 3, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE, ''),
    -- AE1 - v1  -------------------------------------------------------------------------------------------------------
    (111001, 111000, 'Ist dies eine Einzelauswahl?', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE,
     ''),
    (111002, 111000, 'Ist dies eine Mehrfachauswahl?', 2, '{f,f,f}', '{"Keine Angabe",Ja,Nein}', '{99,1,0}', 2, FALSE,
     NULL, NULL, FALSE, ''),
    (111003, 111000, 'Können hier nur Zahlen eingetragen werden?', 3, '{}', '{}', '{}', 3, FALSE, NULL, NULL, FALSE,
     ''),
    (111004, 111000, 'Klappt diese Freitextfrage?', 4, '{}', '{}', '{}', 4, FALSE, NULL, NULL, FALSE, ''),
    (111005, 111000, 'Gib das heutige Datum an.', 5, '{}', '{}', '{}', 5, FALSE, NULL, NULL, FALSE, ''),
    (111006, 111000, 'Wähle ja, und prüfe, ob eine weitere Frage erscheint (Prüfung von Bedingung).', 1, '{f,f}',
     '{Ja,Nein}', '{1,0}', 6, FALSE, NULL, NULL, FALSE, ''),
    (111007, 111000, 'Lade ein Foto hoch.', 8, '{}', '{}', '{}', 7, FALSE, NULL, NULL, FALSE, ''),
    (111008, 111000, 'Gib eine Proben-ID ein.', 6, '{}', '{}', '{}', 8, FALSE, NULL, NULL, FALSE, ''),
    (111009, 111000, 'Gib eine PZN ein.', 7, '{}', '{}', '{}', 9, FALSE, NULL, NULL, FALSE, ''),
    (111010, 111000, 'Zeitstempel', 9, '{}', '{}', '{}', 10, FALSE, NULL, NULL, FALSE, ''),
    -- AE 1 - v2 -------------------------------------------------------------------------------------------------------
    (121001, 121000, 'Ist dies eine Einzelauswahl?', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE,
     'Einzelauswahl'),
    (121002, 121000, 'Ist dies eine Mehrfachauswahl?', 2, '{f,f,f}', '{"Keine Angabe",Ja,Nein}', '{99,1,0}', 2, FALSE,
     NULL, NULL, FALSE, 'Mehrfachauswahl'),
    (121003, 121000, 'Können hier nur Zahlen eingetragen werden?', 3, '{}', '{}', '{}', 3, FALSE, NULL, NULL, FALSE,
     'Zahlen'),
    (121004, 121000, 'Klappt diese Freitextfrage?', 4, '{}', '{}', '{}', 4, FALSE, NULL, NULL, FALSE, 'Text'),
    (121005, 121000, 'Gib das heutige Datum an.', 5, '{}', '{}', '{}', 5, FALSE, NULL, NULL, FALSE, 'Datum'),
    (121006, 121000, 'Wähle ja, und prüfe, ob eine weitere Frage erscheint (Prüfung von Bedingung).', 1, '{f,f}',
     '{Ja,Nein}', '{1,0}', 6, FALSE, NULL, NULL, FALSE, 'EinzelauswahlBedingt'),
    (121007, 121000, 'Lade ein Foto hoch.', 8, '{}', '{}', '{}', 7, FALSE, NULL, NULL, FALSE, 'Foto'),
    (121008, 121000, 'Gib eine Proben-ID ein.', 6, '{}', '{}', '{}', 8, FALSE, NULL, NULL, FALSE, 'Probe'),
    (121009, 121000, 'Gib eine PZN ein.', 7, '{}', '{}', '{}', 9, FALSE, NULL, NULL, FALSE, 'PZN'),
    (121010, 121000, 'Zeitstempel', 9, '{}', '{}', '{}', 10, FALSE, NULL, NULL, FALSE, 'Zeitstempel'),
    -- AE1 - v3 -------------------------------------------------------------------------------------------------------
    -- Condition on questionnaire
    (131001, 131000, 'Einzelauswahl', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE,
    'Einzelauswahl'),
    (131002, 131000, 'Mehrfachauswahl', 2, '{f,f,f}', '{"Keine Angabe",Ja,Nein}', '{99,1,0}', 2, FALSE,
    NULL, NULL, FALSE, 'Mehrfachauswahl'),
    (131003, 131000, 'Zahlen', 3, '{}', '{}', '{}', 3, FALSE, NULL, NULL, FALSE,
    'Zahlen'),
    (131004, 131000, 'Text', 4, '{}', '{}', '{}', 4, FALSE, NULL, NULL, FALSE, 'Text'),
    (131005, 131000, 'Datum', 5, '{}', '{}', '{}', 5, FALSE, NULL, NULL, FALSE, 'Datum'),
    (131006, 131000, 'Foto', 8, '{}', '{}', '{}', 6, FALSE, NULL, NULL, FALSE, 'Foto'),
    (131007, 131000, 'Proben-ID', 6, '{}', '{}', '{}', 7, FALSE, NULL, NULL, FALSE, 'Probe'),
    (131008, 131000, 'PZN', 7, '{}', '{}', '{}', 8, FALSE, NULL, NULL, FALSE, 'PZN'),
    (131009, 131000, 'Zeitstempel', 9, '{}', '{}', '{}', 9, FALSE, NULL, NULL, FALSE, 'Zeitstempel'),
    -- AE 1 - v4 -------------------------------------------------------------------------------------------------------
    -- Question 1: Will decide if question 2 should be shown
    (141001, 141000, 'Frage 2 anzeigen', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE, 'ShowQ2'),
    -- Question 2: Question with internal_this condition on previous questions answer option
    (142001, 142000, 'Einzelauswahl', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE,
     'Einzelauswahl'),
    (142002, 142000, 'Mehrfachauswahl', 2, '{f,f,f}', '{"Keine Angabe",Ja,Nein}', '{99,1,0}', 2, FALSE,
     NULL, NULL, FALSE, 'Mehrfachauswahl'),
    (142003, 142000, 'Zahlen', 3, '{}', '{}', '{}', 3, FALSE, NULL, NULL, FALSE,
     'Zahlen'),
    (142004, 142000, 'Text', 4, '{}', '{}', '{}', 4, FALSE, NULL, NULL, FALSE, 'Text'),
    (142005, 142000, 'Datum', 5, '{}', '{}', '{}', 5, FALSE, NULL, NULL, FALSE, 'Datum'),
    (142006, 142000, 'Foto', 8, '{}', '{}', '{}', 6, FALSE, NULL, NULL, FALSE, 'Foto'),
    (142007, 142000, 'Proben-ID', 6, '{}', '{}', '{}', 7, FALSE, NULL, NULL, FALSE, 'Probe'),
    (142008, 142000, 'PZN', 7, '{}', '{}', '{}', 8, FALSE, NULL, NULL, FALSE, 'PZN'),
    (142009, 142000, 'Zeitstempel', 9, '{}', '{}', '{}', 9, FALSE, NULL, NULL, FALSE, 'Zeitstempel'),
    -- AE 1 - v5 -------------------------------------------------------------------------------------------------------
    (151001, 151000, 'Text', 4, '{}', '{}', '{}', 1, FALSE, NULL, NULL, FALSE, 'Text'),
    (151002, 151000, 'Datum', 5, '{}', '{}', '{}', 2, FALSE, NULL, NULL, FALSE, 'Datum'),
    (151003, 151000, 'Zahlen', 3, '{}', '{}', '{}', 3, FALSE, NULL, NULL, FALSE, 'Zahlen'),
    (151004, 151000, 'Mehrfachauswahl', 2, '{f,f,f}', '{This,That,Nope}', '{2,1,-1}', 4, FALSE,
     NULL, NULL, FALSE, 'Mehrfachauswahl'),
    (151005, 151000, 'Einzelauswahl', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 5, FALSE, NULL, NULL, FALSE,
     'Einzelauswahl'),
    (151006, 151000, 'Text 2', 4, '{}', '{}', '{}', 6, FALSE, NULL, NULL, FALSE, 'Text2'),
    (151007, 151000, 'External Condition', 4, '{}', '{}', '{}', 7, FALSE, NULL, NULL, FALSE, 'External'),
    -- AE - v6 -------------------------------------------------------------------------------------------------------
    (161001, 161000, 'Einzelauswahl', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE,
     'Einzelauswahl'),
    (161002, 161000, 'Text', 4, '{}', '{}', '{}', 2, FALSE, NULL, NULL, FALSE, 'Text'),
    -- AE2
    -- v1
    (211001, 211000, 'Einzelauswahl?', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE, ''),
    -- v2
    (221001, 221000, 'Einzelauswahl?', 1, '{f,f}', '{Ja,Nein}', '{1,0}', 1, FALSE, NULL, NULL, FALSE, '')
;

--
-- Conditions
--
INSERT INTO conditions (condition_type, condition_answer_option_id, condition_question_id, condition_questionnaire_id,
                        condition_operand, condition_value, condition_target_answer_option,
                        condition_target_questionnaire, condition_link, condition_questionnaire_version,
                        condition_target_questionnaire_version)
VALUES
    -- condition on questionnaire
    ('external', NULL, NULL, 100000, '==', 'Ja', 911001, 900000, 'AND', 3, 1),
    -- condition on question
    ('external', NULL, 141000, NULL, '==', 'Ja', 911001, 900000, 'AND', 4, 1),
    ('internal_this', NULL, 142000, NULL, '==', 'Ja', 141001, 100000, 'AND', 4, 4),
    -- condition on answer option
    ('internal_this', 151002, NULL, NULL, '==', 'Right', 151001, 100000, 'AND', 5, 5),
    ('internal_this', 151003, NULL, NULL, '==', '2022-12-10T23:00:00+00:00', 151002, 100000, 'AND', 5, 5),
    ('internal_this', 151004, NULL, NULL, '>', '99', 151003, 100000, 'AND', 5, 5),
    ('internal_this', 151005, NULL, NULL, '==', 'This;That', 151004, 100000, 'AND', 5, 5),
    ('internal_this', 151006, NULL, NULL, '==', 'Ja', 151005, 100000, 'AND', 5, 5),
    ('external', 151007, NULL, NULL, '==', 'Ja', 911001, 900000, 'AND', 5, 1),
    -- conditions on questions and answer options cascading down
    ('internal_this', 161002, NULL, NULL, '==', 'Ja', 161001, 100000, 'AND', 6, 6),
    ('external', NULL, 161000, NULL, '==', 'Ja', 911001, 900000, 'AND', 6, 1)
;

-- id: [questionnaire]{1}[version]{1}[user id postfix]{2}[consecutive number for instance]{2}
INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status, notifications_scheduled,
                                     progress, release_version, questionnaire_version)
VALUES
    -- Instances for conditions ---------------------------------------------------------------
    (910101, 'Answers Export', 900000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 1),
    (910201, 'Answers Export', 900000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 1),
    (910301, 'Answers Export', 900000, 'For Probands', 'answ-03', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 1),
    -- AE1 v1 --------------------------------------------------------------------------------
    -- answ-01
    (110101, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 1),
    (110102, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-14 22:00:00.000000',
     '2022-12-14 08:51:05.000000', NULL, 2,
     'released_once', FALSE, 0, 1, 1),
    (110103, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-21 23:00:00.000000',
     NULL, NULL, 3,
     'in_progress', FALSE, 0, 0, 1),
    -- answ-02
    (110201, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 1),
    (110202, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-14 22:00:00.000000',
     '2022-12-14 08:51:05.000000', NULL, 2,
     'released_once', FALSE, 0, 1, 1),
    (110203, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-21 23:00:00.000000',
     NULL, NULL, 3,
     'in_progress', FALSE, 0, 0, 1),
    -- answ-03
    (110301, 'Answers Export', 100000, 'For Probands', 'answ-03', '2022-12-07 23:00:00.000000',
     NULL, NULL, 1,
     'active', FALSE, 0, 0, 1),
    -- answ-04
    (110401, 'Answers Export', 100000, 'For Probands', 'answ-04', '2022-12-07 23:00:00.000000',
     NULL, NULL, 1,
     'expired', FALSE, 0, 0, 1),
    -- AE1 v2 --------------------------------------------------------------------------------
    -- answ-01
    (120101, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 2),
    -- AE1 v3 --------------------------------------------------------------------------------
    -- answ-01
    (130101, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 3),
    -- answ-02
    (130201, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     null, null, 1,
     'active', FALSE, 0, 0, 3),
    -- answ-03
    (130301, 'Answers Export', 100000, 'For Probands', 'answ-03', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 3),
    -- AE1 v4 --------------------------------------------------------------------------------
    -- answ-01
    (140101, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 4),
    (140102, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 2,
     'released_once', FALSE, 0, 1, 4),
    -- answ-02
    (140201, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_once', FALSE, 0, 1, 4),
    -- AE1 v5 --------------------------------------------------------------------------------
    -- answ-01
    (150101, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 5),
    (150102, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 2,
     'released_twice', FALSE, 0, 2, 5),
    (150103, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 3,
     'released_twice', FALSE, 0, 2, 5),
    (150104, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 4,
     'released_twice', FALSE, 0, 2, 5),
    (150105, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 5,
     'released_twice', FALSE, 0, 2, 5),
    (150106, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 6,
     'released_twice', FALSE, 0, 2, 5),
    (150107, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 7,
     'released_twice', FALSE, 0, 2, 5),
    (150108, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 8,
     'released_twice', FALSE, 0, 2, 5),
    (150109, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 9,
     'released_twice', FALSE, 0, 2, 5),
    -- answ-02
    (150201, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 5),
    (150202, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 2,
     'released_twice', FALSE, 0, 2, 5),
    -- AE1 v6 --------------------------------------------------------------------------------
    -- answ-01
    (160101, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 6),
    (160102, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 2,
     'released_twice', FALSE, 0, 2, 6),
    (160103, 'Answers Export', 100000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 3,
     'released_twice', FALSE, 0, 2, 6),
    -- answ-02
    (160201, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 6),
    (160202, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 2,
     'released_twice', FALSE, 0, 2, 6),
    (160203, 'Answers Export', 100000, 'For Probands', 'answ-02', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 3,
     'released_twice', FALSE, 0, 2, 6),
    -- AE2 v1 --------------------------------------------------------------------------------
    (220101, 'Answers Export', 200000, 'For Probands', 'answ-99', '2022-12-07 07:00:00.000000',
     '2022-12-08 08:57:59.000000', '2022-12-09 08:57:59.000000', 1,
     'released_twice', FALSE, 0, 2, 1),
    -- AE2 v2 --------------------------------------------------------------------------------
    (220102, 'Answers Export', 200000, 'For Probands', 'answ-01', '2022-12-07 07:00:00.000000',
    null, null, 1,
    'active', FALSE, 0, 2, 2)
;

-- id: 9[user id postfix]{2}[consecutive number]{2}
INSERT INTO user_files (id, user_id, questionnaire_instance_id, answer_option_id, file_name, file)
VALUES
    -- answ-01
    (90101, 'answ-01', 110101, 111007, '1px.jpeg',
     'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='),
    (90102, 'answ-01', 110102, 111007, 'file.pdf',
     'data:application/pdf;base64,JVBERi0xLg10cmFpbGVyPDwvUm9vdDw8L1BhZ2VzPDwvS2lkc1s8PC9NZWRpYUJveFswIDAgMyAzXT4+XT4+Pj4+Pg=='),
    (90103, 'answ-01', 110103, 111007, 'should-not-show-up.jpeg', 'just some data that is not base64'),
    (90104, 'answ-01', 110101, 111007, 'should-not-show-up-too.jpeg',
     'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='),
    (90105, 'answ-01', 110101, 111007, 'should-not-show-up-too.jpeg',
     'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='),
    (90106, 'answ-01', 110101, 111007, '1px.jpeg',
     'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='),
    -- answ-02
    (90201, 'answ-02', 110201, 111007, '1px.jpeg',
     'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='),
    (90202, 'answ-02', 110202, 111007, 'file.pdf',
     'data:application/pdf;base64,JVBERi0xLg10cmFpbGVyPDwvUm9vdDw8L1BhZ2VzPDwvS2lkc1s8PC9NZWRpYUJveFswIDAgMyAzXT4+XT4+Pj4+Pg=='),
    (90203, 'answ-02', 110203, 111007, 'should-not-show-up.jpeg', 'just some data that is not base64')
;

INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value, date_of_release,
                     releasing_person)
VALUES
    -- Answers for conditions ------------------------------------------------------------------------------------------
    (910101, 911000, 911001, 2, 'Ja', NULL, NULL), -- answ-01
    (910201, 911000, 911001, 2, 'Nein', NULL, NULL), -- answ-02
    (910301, 911000, 911001, 2, 'Nein', NULL, NULL), -- answ-03
    -- External condition on questions
    -- v1 answ-01 ------------------------------------------------------------------------------------------------------
    -- cycle 1 - answer versions should be selected based on the instances release version
    (110101, 111000, 111001, 1, '', NULL, NULL),
    (110101, 111000, 111002, 1, '', NULL, NULL),
    (110101, 111000, 111003, 1, '', NULL, NULL),
    (110101, 111000, 111004, 1, '', NULL, NULL),
    (110101, 111000, 111005, 1, '', NULL, NULL),
    (110101, 111000, 111006, 1, '', NULL, NULL),
    (110101, 111000, 111007, 1, '90104', NULL, NULL),
    (110101, 111000, 111008, 1, '', NULL, NULL),
    (110101, 111000, 111009, 1, '', NULL, NULL),
    (110101, 111000, 111010, 1, '', NULL, NULL),
    -- Empty answers with versioning 1 should never been selected and the file not be exported, as answers with versioning 2 overwrite them
    (110101, 111000, 111001, 2, 'Ja', NULL, NULL),
    (110101, 111000, 111002, 2, 'Nein;Ja', NULL, NULL),
    (110101, 111000, 111003, 2, '49', NULL, NULL),
    (110101, 111000, 111004, 2, 'Ältere Übere Öbere Faß àÀ', NULL, NULL),
    -- Test if we are compatible to an older timestamp format
    (110101, 111000, 111005, 2, 'Tue Jun 08 2021 03:00:00 GMT+0200 (Mitteleuropäische Sommerzeit)', NULL, NULL),
    (110101, 111000, 111006, 2, 'Ja', NULL, NULL),
    (110101, 111000, 111007, 2, '90101', NULL, NULL),
    (110101, 111000, 111008, 2, 'ANSW-1234567890;ANSW-0987654321', NULL, NULL),
    (110101, 111000, 111009, 2, 'PZN-5678', NULL, NULL),
    (110101, 111000, 111010, 2, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- cycle 2
    (110102, 111000, 111001, 1, 'Ja', NULL, NULL),
    (110102, 111000, 111002, 1, 'Nein;Ja;', NULL, NULL),
    (110102, 111000, 111003, 1, '49', NULL, NULL),
    (110102, 111000, 111004, 1, 'Freitext', NULL, NULL),
    (110102, 111000, 111005, 1, '2021-06-08T07:29:34.545Z', NULL, NULL),
    (110102, 111000, 111006, 1, 'Nein', NULL, NULL),
    (110102, 111000, 111007, 1, '90102', NULL, NULL),
    (110102, 111000, 111008, 1, 'ANSW-1234567890', NULL, NULL),
    (110102, 111000, 111009, 1, 'PZN-5678', NULL, NULL),
    (110102, 111000, 111010, 1, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- The empty answers should never been selected and the file not be exported, as cycle 2 has been release once
    (110102, 111000, 111001, 2, '', NULL, NULL),
    (110102, 111000, 111002, 2, '', NULL, NULL),
    (110102, 111000, 111003, 2, '', NULL, NULL),
    (110102, 111000, 111004, 2, '', NULL, NULL),
    (110102, 111000, 111005, 2, '', NULL, NULL),
    (110102, 111000, 111006, 2, '', NULL, NULL),
    (110102, 111000, 111007, 2, '90105', NULL, NULL),
    (110102, 111000, 111008, 2, '', NULL, NULL),
    (110102, 111000, 111009, 2, '', NULL, NULL),
    (110102, 111000, 111010, 2, '', NULL, NULL),
    -- cycle 3
    (110103, 111000, 111001, 0, 'Ja', NULL, NULL),
    (110103, 111000, 111002, 0, 'Nein;Ja,', NULL, NULL),
    (110103, 111000, 111003, 0, '49', NULL, NULL),
    (110103, 111000, 111004, 0, 'Freitext', NULL, NULL),
    (110103, 111000, 111005, 0, '2021-10-11T12:13:14.150Z', NULL, NULL),
    (110103, 111000, 111006, 0, 'Nein', NULL, NULL),
    (110103, 111000, 111007, 0, '', NULL, NULL),
    (110103, 111000, 111008, 0, 'ANSW-1234567890', NULL, NULL),
    (110103, 111000, 111009, 0, 'PZN-5678', NULL, NULL),
    (110103, 111000, 111010, 0, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:
    -- v1 answ-02 ------------------------------------------------------------------------------------------------------
    -- cycle 1
    (110201, 111000, 111001, 2, 'Ja', NULL, NULL),
    (110201, 111000, 111002, 2, 'Nein;Ja', NULL, NULL),
    (110201, 111000, 111003, 2, '49', NULL, NULL),
    (110201, 111000, 111004, 2, 'Ältere Übere Öbere Faß àÀ', NULL, NULL),
    -- Test if we are compatible to an older timestamp format
    (110201, 111000, 111005, 2, 'Tue Jun 08 2021 03:00:00 GMT+0200 (Mitteleuropäische Sommerzeit)', NULL, NULL),
    (110201, 111000, 111006, 2, 'Ja', NULL, NULL),
    (110201, 111000, 111007, 2, '90201', NULL, NULL),
    (110201, 111000, 111008, 2, 'ANSW-1234567890;ANSW-0987654321', NULL, NULL),
    (110201, 111000, 111009, 2, 'PZN-5678', NULL, NULL),
    (110201, 111000, 111010, 2, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- cycle 2
    (110202, 111000, 111001, 1, 'Ja', NULL, NULL),
    (110202, 111000, 111002, 1, 'Nein;Ja;', NULL, NULL),
    (110202, 111000, 111003, 1, '49', NULL, NULL),
    (110202, 111000, 111004, 1, 'Freitext', NULL, NULL),
    (110202, 111000, 111005, 1, '2021-06-08T07:29:34.545Z', NULL, NULL),
    (110202, 111000, 111006, 1, 'Nein', NULL, NULL),
    (110202, 111000, 111007, 1, '90202', NULL, NULL),
    (110202, 111000, 111008, 1, 'ANSW-1234567890', NULL, NULL),
    (110202, 111000, 111009, 1, 'PZN-5678', NULL, NULL),
    (110202, 111000, 111010, 1, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- cycle 3
    (110203, 111000, 111001, 1, 'Ja', NULL, NULL),
    (110203, 111000, 111002, 1, 'Nein;Ja;', NULL, NULL),
    (110203, 111000, 111003, 1, '49', NULL, NULL),
    (110203, 111000, 111004, 1, 'Freitext', NULL, NULL),
    (110203, 111000, 111005, 1, '2021-10-11T12:13:14.150Z', NULL, NULL),
    (110203, 111000, 111006, 1, 'Nein', NULL, NULL),
    (110203, 111000, 111007, 1, '', NULL, NULL),
    (110203, 111000, 111008, 1, 'ANSW-1234567890', NULL, NULL),
    (110203, 111000, 111009, 1, 'PZN-5678', NULL, NULL),
    (110203, 111000, 111010, 1, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- v1 answ-03 - active ---------------------------------------------------------------------------------------------
    -- has no answers as the questionnaire instance is just active
    -- v1 answ-04 - expired --------------------------------------------------------------------------------------------
    -- cycle 1
    (110401, 111000, 111001, 1, 'Ja', NULL, NULL),
    (110401, 111000, 111002, 1, 'Nein;Ja;', NULL, NULL),
    (110401, 111000, 111003, 1, '49', NULL, NULL),
    (110401, 111000, 111004, 1, 'Freitext', NULL, NULL),
    (110401, 111000, 111005, 1, '2021-10-11T12:13:14.150Z', NULL, NULL),
    (110401, 111000, 111006, 1, 'Nein', NULL, NULL),
    (110401, 111000, 111007, 1, '', NULL, NULL),
    (110401, 111000, 111008, 1, 'ANSW-1234567890', NULL, NULL),
    (110401, 111000, 111009, 1, 'PZN-5678', NULL, NULL),
    (110401, 111000, 111010, 1, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- v2 answ-01 ------------------------------------------------------------------------------------------------------
    -- cycle 1
    (120101, 121000, 121001, 2, 'Ja', NULL, NULL),
    (120101, 121000, 121002, 2, 'Nein', NULL, NULL),
    (120101, 121000, 121003, 2, '49', NULL, NULL),
    (120101, 121000, 121004, 2, 'Freitext', NULL, NULL),
    (120101, 121000, 121005, 2, '2021-10-12T00:13:14.150Z', NULL, NULL),
    (120101, 121000, 121006, 2, 'Ja', NULL, NULL),
    (120101, 121000, 121007, 2, '', NULL, NULL),
    (120101, 121000, 121008, 2, 'ANSW-1234567890', NULL, NULL),
    (120101, 121000, 121009, 2, 'PZN-5678', NULL, NULL),
    (120101, 121000, 121010, 2, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- v3 answ-01 ------------------------------------------------------------------------------------------------------
    -- cycle 1
    (130101, 131000, 131001, 2, 'Ja', NULL, NULL),
    (130101, 131000, 131002, 2, 'Nein', NULL, NULL),
    (130101, 131000, 131003, 2, '49', NULL, NULL),
    (130101, 131000, 131004, 2, 'Freitext', NULL, NULL),
    (130101, 131000, 131005, 2, '2021-10-12T00:13:14.150Z', NULL, NULL),
    (130101, 131000, 131006, 2, '90106', NULL, NULL),
    (130101, 131000, 131007, 2, 'ANSW-1234567890', NULL, NULL),
    (130101, 131000, 131008, 2, 'PZN-5678', NULL, NULL),
    (130101, 131000, 131009, 2, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- v3 answ-03 ------------------------------------------------------------------------------------------------------
    -- cycle 1
    (130301, 131000, 131001, 2, 'Ja', NULL, NULL),
    (130301, 131000, 131002, 2, 'Nein', NULL, NULL),
    (130301, 131000, 121003, 2, '49', NULL, NULL),
    (130301, 131000, 131004, 2, 'Freitext', NULL, NULL),
    (130301, 131000, 131005, 2, '2021-10-12T00:13:14.150Z', NULL, NULL),
    (130301, 131000, 131006, 2, '', NULL, NULL),
    (130301, 131000, 131007, 2, 'ANSW-1234567890', NULL, NULL),
    (130301, 131000, 131008, 2, 'PZN-5678', NULL, NULL),
    (130301, 131000, 131009, 2, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- v4 answ-01 ------------------------------------------------------------------------------------------------------
    -- cycle 1: Question two was shown
    (140101, 141000, 141001, 2, 'Ja', NULL, NULL),
    (140101, 142000, 142001, 2, 'Ja', NULL, NULL),
    (140101, 142000, 142002, 2, 'Keine Angabe', NULL, NULL),
    (140101, 142000, 142003, 2, '49', NULL, NULL),
    (140101, 142000, 142004, 2, 'Freitext', NULL, NULL),
    (140101, 142000, 142005, 2, '2021-10-12T00:13:14.150Z', NULL, NULL),
    (140101, 142000, 142006, 2, '', NULL, NULL),
    (140101, 142000, 142007, 2, 'ANSW-1234567890', NULL, NULL),
    (140101, 142000, 142008, 2, 'PZN-5678', NULL, NULL),
    (140101, 142000, 142009, 2, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- cycle 2: Question 2 should not be shown
    (140102, 141000, 141001, 1, 'Nein', NULL, NULL),
    (140102, 142000, 142001, 1, 'Ja', NULL, NULL),
    (140102, 142000, 142002, 1, 'Keine Angabe', NULL, NULL),
    -- a missing answer should still lead to a condition based missing
    -- (140102, 142000, 142003, 1, '49', NULL, NULL),
    (140102, 142000, 142004, 1, 'Freitext', NULL, NULL),
    (140102, 142000, 142005, 1, '2021-10-12T00:13:14.150Z', NULL, NULL),
    (140102, 142000, 142006, 1, '', NULL, NULL),
    (140102, 142000, 142007, 1, 'ANSW-1234567890', NULL, NULL),
    (140102, 142000, 142008, 1, 'PZN-5678', NULL, NULL),
    (140102, 142000, 142009, 1, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- v4 answ-02 ------------------------------------------------------------------------------------------------------
    -- cycle 1: Question 1 has a positive answer but an external condition will lead to a missing,
    -- which should also lead to missing for all answer options in question 2
    (140201, 141000, 141001, 1, 'Ja', NULL, NULL),
    (140201, 142000, 142001, 1, 'Ja', NULL, NULL),
    (140201, 142000, 142002, 1, 'Keine Angabe', NULL, NULL),
    (140201, 142000, 142003, 1, '49', NULL, NULL),
    (140201, 142000, 142004, 1, 'Freitext', NULL, NULL),
    (140201, 142000, 142005, 1, '2021-10-12T00:13:14.150Z', NULL, NULL),
    (140201, 142000, 142006, 1, '', NULL, NULL),
    (140201, 142000, 142007, 1, 'ANSW-1234567890', NULL, NULL),
    (140201, 142000, 142008, 1, 'PZN-5678', NULL, NULL),
    (140201, 142000, 142009, 1, '1623165077219', NULL, NULL), -- 2021-06-08T15:11:17+00:00
    -- v5 answ-01 ------------------------------------------------------------------------------------------------------
    -- cycle 1
    (150101, 151000, 151001, 2, '', NULL, NULL),
    (150101, 151000, 151002, 2, '', NULL, NULL),
    (150101, 151000, 151003, 2, '', NULL, NULL),
    (150101, 151000, 151004, 2, '', NULL, NULL),
    (150101, 151000, 151005, 2, '', NULL, NULL),
    (150101, 151000, 151006, 2, '', NULL, NULL),
    (150101, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 2
    (150102, 151000, 151001, 2, 'Wrong', NULL, NULL),
    (150102, 151000, 151002, 2, '', NULL, NULL),
    (150102, 151000, 151003, 2, '', NULL, NULL),
    (150102, 151000, 151004, 2, '', NULL, NULL),
    (150102, 151000, 151005, 2, '', NULL, NULL),
    (150102, 151000, 151006, 2, '', NULL, NULL),
    (150102, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 3
    (150103, 151000, 151001, 2, 'Right', NULL, NULL),
    (150103, 151000, 151002, 2, '', NULL, NULL),
    (150103, 151000, 151003, 2, '', NULL, NULL),
    (150103, 151000, 151004, 2, '', NULL, NULL),
    (150103, 151000, 151005, 2, '', NULL, NULL),
    (150103, 151000, 151006, 2, '', NULL, NULL),
    (150103, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 4
    (150104, 151000, 151001, 2, 'Right', NULL, NULL),
    (150104, 151000, 151002, 2, '2022-12-09T23:00:00+00:00', NULL, NULL),
    (150104, 151000, 151003, 2, '', NULL, NULL),
    (150104, 151000, 151004, 2, '', NULL, NULL),
    (150104, 151000, 151005, 2, '', NULL, NULL),
    (150104, 151000, 151006, 2, '', NULL, NULL),
    (150104, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 5
    (150105, 151000, 151001, 2, 'Right', NULL, NULL),
    (150105, 151000, 151002, 2, '2022-12-10T23:00:00+00:00', NULL, NULL),
    (150105, 151000, 151003, 2, '99', NULL, NULL),
    (150105, 151000, 151004, 2, '', NULL, NULL),
    (150105, 151000, 151005, 2, '', NULL, NULL),
    (150105, 151000, 151006, 2, '', NULL, NULL),
    (150105, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 6
    (150106, 151000, 151001, 2, 'Right', NULL, NULL),
    (150106, 151000, 151002, 2, '2022-12-10T23:00:00+00:00', NULL, NULL),
    (150106, 151000, 151003, 2, '100', NULL, NULL),
    (150106, 151000, 151004, 2, 'Nope', NULL, NULL),
    (150106, 151000, 151005, 2, '', NULL, NULL),
    (150106, 151000, 151006, 2, '', NULL, NULL),
    (150106, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 7
    (150107, 151000, 151001, 2, 'Right', NULL, NULL),
    (150107, 151000, 151002, 2, '2022-12-10T23:00:00+00:00', NULL, NULL),
    (150107, 151000, 151003, 2, '100', NULL, NULL),
    (150107, 151000, 151004, 2, 'This;That', NULL, NULL),
    (150107, 151000, 151005, 2, 'Nein', NULL, NULL),
    (150107, 151000, 151006, 2, '', NULL, NULL),
    (150107, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 8
    (150108, 151000, 151001, 2, 'Right', NULL, NULL),
    (150108, 151000, 151002, 2, '2022-12-10T23:00:00+00:00', NULL, NULL),
    (150108, 151000, 151003, 2, '100', NULL, NULL),
    (150108, 151000, 151004, 2, 'This;That', NULL, NULL),
    (150108, 151000, 151005, 2, 'Ja', NULL, NULL),
    (150108, 151000, 151006, 2, '', NULL, NULL),
    (150108, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 9
    (150109, 151000, 151001, 2, 'Right', NULL, NULL),
    (150109, 151000, 151002, 2, '2022-12-10T23:00:00+00:00', NULL, NULL),
    (150109, 151000, 151003, 2, '100', NULL, NULL),
    (150109, 151000, 151004, 2, 'This;That', NULL, NULL),
    (150109, 151000, 151005, 2, 'Ja', NULL, NULL),
    (150109, 151000, 151006, 2, 'Text', NULL, NULL),
    (150109, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- v5 answ-2 --------------------------------------------------------------------------------------------------------
    -- cycle 1
    (150201, 151000, 151001, 2, 'Right', NULL, NULL),
    (150201, 151000, 151002, 2, '2022-12-10T23:00:00+00:00', NULL, NULL),
    (150201, 151000, 151003, 2, '100', NULL, NULL),
    (150201, 151000, 151004, 2, 'This;That', NULL, NULL),
    (150201, 151000, 151005, 2, 'Ja', NULL, NULL),
    (150201, 151000, 151006, 2, 'Text', NULL, NULL),
    (150201, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- cycle 2
    (150202, 151000, 151001, 2, 'Right', NULL, NULL),
    (150202, 151000, 151002, 2, '2022-12-10T23:00:00+00:00', NULL, NULL),
    (150202, 151000, 151003, 2, '100', NULL, NULL),
    (150202, 151000, 151004, 2, 'This;That', NULL, NULL),
    (150202, 151000, 151005, 2, 'Ja', NULL, NULL),
    (150202, 151000, 151006, 2, 'Wrong Text', NULL, NULL),
    (150202, 151000, 151007, 2, 'Some Text', NULL, NULL),
    -- v6 answ-1 --------------------------------------------------------------------------------------------------------
    -- cycle 1
    (160101, 161000, 161001, 2, 'Nein', NULL, NULL),
    (160101, 161000, 161002, 2, 'Text', NULL, NULL),
    -- cycle 2
    (160102, 161000, 161001, 2, 'Ja', NULL, NULL),
    (160102, 161000, 161002, 2, '', NULL, NULL),
    -- cycle 3
    (160103, 161000, 161001, 2, 'Ja', NULL, NULL),
    (160103, 161000, 161002, 2, 'Text', NULL, NULL),
    -- v6 answ-2 --------------------------------------------------------------------------------------------------------
    -- cycle 1
    (160201, 161000, 161001, 2, 'Nein', NULL, NULL),
    (160201, 161000, 161002, 2, 'Text', NULL, NULL),
    -- cycle 2
    (160202, 161000, 161001, 2, 'Ja', NULL, NULL),
    (160202, 161000, 161002, 2, '', NULL, NULL),
    -- cycle 3
    (160203, 161000, 161001, 2, 'Ja', NULL, NULL),
    (160203, 161000, 161002, 2, 'Text', NULL, NULL)

;