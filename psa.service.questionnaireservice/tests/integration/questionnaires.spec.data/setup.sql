-- Studies
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestStudy1', 'ApiTestStudy1 Beschreibung', FALSE),
       ('ApiTestStudy2', 'ApiTestStudy2 Beschreibung', FALSE),
       ('ApiTestStudy3', 'ApiTestStudy3 Beschreibung', FALSE);

-- Users
INSERT INTO probands(pseudonym, compliance_labresults, compliance_samples, study)
VALUES ('qtest-proband1', TRUE, TRUE, 'ApiTestStudy1'),
       ('qtest-proband2', TRUE, TRUE, 'ApiTestStudy2'),
       ('qtest-proband3', FALSE, FALSE, 'ApiTestStudy1'),
       ('qtest-proband4', TRUE, TRUE, 'ApiTestStudy3');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudy1', 'qtest-forscher1', 'write'),
       ('ApiTestStudy1', 'qtest-probandenmanager', 'write'),
       ('ApiTestStudy1', 'qtest-untersuchungsteam', 'write'),
       ('ApiTestStudy2', 'qtest-forscher2', 'admin'),
       ('ApiTestStudy3', 'qtest-forscher1', 'write');

-- Questionnaires
-- HINT: The number in this setup file has a design for easier usage: <study_number>00<questionnaire><question-position><answer_option-position>(<version>)
INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed, expires_after_days,
                            finalises_after_days, created_at, type)
VALUES (100100, 1, 'ApiTestStudy1', 'ApiImageTestQuestionnaire2', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 5, 2, CURRENT_DATE, 'for_research_team');
INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed)
VALUES (100200, 1, 'ApiTestStudy1', 'ApiTestQuestionnaire2v1', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE);
INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed)
VALUES (100200, 2, 'ApiTestStudy1', 'ApiTestQuestionnaire2v2', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE);
INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed, expires_after_days,
                            finalises_after_days, created_at, type)
VALUES (100300, 1, 'ApiTestStudy1', 'ApiTestQuestionnaire', 1, 1, 'week', 1, 365, 13, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 1, 1, CURRENT_DATE, 'for_research_team');
INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (100400, 1, 'ApiTestStudy1', 'ApiTestQuestionnaire4', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht');
INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (100500, 1, 'ApiTestStudy1', 'ApiTestQuestionnaire5', 1, 1, 'day', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht');

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (200100, 'ApiTestStudy2', 'ApiTestConditionTargetQuestionnaire', 1, NULL, 'once', 1, 50, 3,
        'PIA Fragebogen Target',
        'NeuNachrichtTarget', 'AltNachrichtTarget');
INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (200200, 'ApiTestStudy2', 'ApiTestConditionSourceQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachrichtSource', 'AltNachrichtSource');

INSERT INTO questionnaires (id, version, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress)
VALUES (200300, 1, 'ApiTestStudy2', 'ApiTestGeneratedVariableNames', 1, NULL, 'once', 1, 365, 0,
        '', '', '');


INSERT INTO questions (id, questionnaire_id, questionnaire_version, text, position, is_mandatory, variable_name)
VALUES (1001101, 100100, 1, 'Mach mal n Bild', 1, TRUE, ''),

       (1002101, 100200, 1, 'Haben Sie Fieber?', 1, TRUE, ''),
       (1002201, 100200, 1, 'Wie fühlen Sie sich?', 2, TRUE, ''),

       (1002102, 100200, 2, 'Haben Sie Fieber?', 1, TRUE, ''),
       (1002202, 100200, 2, 'Wie fühlen Sie sich?', 2, TRUE, ''),

       (1003101, 100300, 1, 'Wie fühlen Sie sich?', 1, TRUE, ''),

       (1004101, 100400, 1, 'Wie fühlen Sie sich?', 1, TRUE, ''),
       (1004201, 100400, 1, 'Haben Sie Fieber?', 2, TRUE, ''),

       (1005101, 100500, 1, 'Wie fühlen Sie sich?', 1, TRUE, ''),

       (2001101, 200100, 1, 'Haben Sie Fieber?', 1, TRUE, ''),
       (2001201, 200100, 1, 'Haben Sie Schmerzen?', 2, TRUE, ''),

       (2002101, 200200, 1, 'Bedingung auf Ja', 1, TRUE, ''),
       (2002201, 200200, 1, 'Bedingung auf Nein', 2, TRUE, ''),
       (2002301, 200200, 1, 'Frage ohne Unterfrage', 3, FALSE, ''),
       (2003101, 200300, 1, 'Frage mit Variablennamen', 1, FALSE, 'auto-11111111');

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position, variable_name)
VALUES (1001111, 1001101, '', 10, '{}', 1, ''),

       (1002111, 1002101, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),
       (1002211, 1002201, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1, ''),
       (1002221, 1002201, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2, ''),
       (1002231, 1002201, 'Sample id einscannen', 6, '{}', 3, ''),
       (1002241, 1002201, 'Bitte laden sie das Bild hoch', 8, '{}', 4, ''),
       (1002251, 1002201, 'Bitte laden sie das zweite Bild hoch', 8, '{}', 5, ''),
       (1002261, 1002201, 'Bitte laden sie das dritte Bild hoch', 8, '{}', 6, ''),
       (1002271, 1002201, 'Bitte laden sie das vierte Bild hoch', 8, '{}', 7, ''),

       (1002112, 1002102, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),
       (1002212, 1002202, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1, ''),
       (1002222, 1002202, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2, ''),
       (1002232, 1002202, 'Sample id einscannen', 6, '{}', 3, ''),
       (1002242, 1002202, 'Bitte laden sie das Bild hoch', 8, '{}', 4, ''),
       (1002252, 1002202, 'Bitte laden sie das zweite Bild hoch', 8, '{}', 5, ''),
       (1002262, 1002202, 'Bitte laden sie das dritte Bild hoch', 8, '{}', 6, ''),
       (1002272, 1002202, 'Bitte laden sie das vierte Bild hoch', 8, '{}', 7, ''),

       (1003111, 1003101, 'Q2Frage1Sub2', 10, '{}', 1, ''),

       (1004111, 1004101, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),
       (1004121, 1004101, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2, ''),
       (1004211, 1004201, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),

       (2001111, 2001101, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),
       (2001211, 2001201, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),
       (2001221, 2001201, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2, ''),

       (2002111, 2002101, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),
       (2002121, 2002101, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2, ''),
       (2002211, 2002201, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1, ''),
       (2002221, 2002201, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2, ''),
       (2003111, 2003101, '', 4, NULL, 1, 'auto-22222222'),
       (2003121, 2003101, '', 4, NULL, 2, 'auto-33333333');


-- Conditions
INSERT INTO conditions (condition_type, condition_answer_option_id, condition_question_id, condition_questionnaire_id,
                        condition_operand, condition_value, condition_target_answer_option,
                        condition_target_questionnaire, condition_link)
VALUES ('external', NULL, 1004201, NULL, '==', 'Ja', 1002112, 100200, 'OR'),
       ('external', NULL, NULL, 100500, '==', 'Ja', 1004211, 100400, 'OR'),

       ('internal_last', NULL, 2001101, NULL, '==', 'Ja', 2001111, 200100, 'OR'),

       ('external', NULL, NULL, 200200, '==', 'Ja;Nein;', 2001111, 200100, 'OR'),
       ('external', NULL, 2002101, NULL, '==', 'Ja;Nein;', 2001111, 200100, 'OR'),
       ('internal_last', NULL, 2002201, NULL, '\=', 'Ja', 2001111, 200100, 'AND'),
       ('internal_this', 2002121, NULL, NULL, '\=', 'Ja', 2002111, 200200, 'OR'),
       ('internal_this', 2002211, NULL, NULL, '==', 'Ja', 2002111, 200200, 'OR');


INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (110300, 'ApiTestStudy1', 100300, 'ApiTestQuestionnaire', 'qtest-proband1', '08.08.2017', NULL, NULL, 1,
        'in_progress'),
       (120300, 'ApiTestStudy1', 100300, 'ApiTestQuestionnaire', 'qtest-proband1', '09.08.2017', NULL, NULL, 1,
        'active'),
       (130300, 'ApiTestStudy1', 100300, 'ApiTestQuestionnaire', 'qtest-proband1', '10.08.2017', NULL, NULL, 1,
        'inactive'),
       (140300, 'ApiTestStudy1', 100300, 'ApiTestQuestionnaire', 'qtest-proband1', '08.08.2017', '09.08.2017', NULL, 1,
        'released');
INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (140300, 1003101, 1003111, 1, '999999');
INSERT INTO user_files(id, user_id, questionnaire_instance_id, answer_option_id, file)
VALUES (999999, 'qtest-proband1', 140300, 1003111,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC');
