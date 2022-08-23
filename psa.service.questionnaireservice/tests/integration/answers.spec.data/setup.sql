INSERT INTO studies(name, description, pm_email, hub_email, status, address, has_rna_samples, sample_prefix,
                    sample_suffix_length, has_logging_opt_in)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung', 'pm@pia.de', 'hub@pia.de', 'active',
        'Studienzentrum des ApiTestStudie für Infektionsforschung<br> ApiTestStudie<br> Api-Test-Str. 1<br> 53111 Bonn<br> Tel.: 0111 1111 1111<br> Fax: 0111 1111 1111<br> Email: ApiTestStudie@ApiTestStudie.de',
        FALSE, 'TESTPREFIX', 5, FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestStudi2', 'ApiTestStudi2 Beschreibung', FALSE),
       ('ApiTestStudi3', 'ApiTestStudi3 Beschreibung', FALSE),
       ('ApiTestStudi4', 'ApiTestStudi4 Beschreibung', FALSE);

INSERT INTO probands(pseudonym, compliance_labresults, compliance_samples, study)
VALUES ('qtest-proband1', TRUE, TRUE, 'ApiTestStudie'),
       ('qtest-proband2', TRUE, TRUE, 'ApiTestStudi2'),
       ('qtest-proband3', FALSE, FALSE, 'ApiTestStudie'),
       ('qtest-proband4', TRUE, TRUE, 'ApiTestStudi4'),
       ('qtest-proband5', TRUE, TRUE, 'ApiTestStudi4');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'qtest-forscher1', 'write'),
       ('ApiTestStudi2', 'qtest-forscher2', 'admin'),
       ('ApiTestStudi4', 'qtest-forscher2', 'write'),
       ('ApiTestStudie', 'qtest-untersuchungsteam', 'write'),
       ('ApiTestStudi2', 'qtest-untersuchungsteam2', 'write'),
       ('ApiTestStudie', 'qtest-probandenmanager', 'write');

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed)
VALUES (99999, 'ApiTestStudie', 'ApiTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE);

INSERT INTO questions
VALUES (99991, 99999, 'Haben Sie Fieber?', 1, TRUE);
INSERT INTO questions
VALUES (99992, 99999, 'Wie fühlen Sie sich?', 1, TRUE);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (99991, 99991, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (99992, 99992, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1),
       (99993, 99992, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (99994, 99992, 'Sample id einscannen', 6, 3),
       (99995, 99992, 'Bitte laden sie das Bild hoch', 8, 4),
       (99980, 99992, 'Bitte laden sie das zweite Bild hoch', 8, 5),
       (99981, 99992, 'Bitte laden sie das dritte Bild hoch', 8, 6),
       (99982, 99992, 'Bitte laden sie das das vierte Bild hoch', 8, 7);

INSERT INTO questionnaires (id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days,
                            deactivate_after_days, notification_tries, notification_title, notification_body_new,
                            notification_body_in_progress, notification_weekday, notification_interval,
                            notification_interval_unit, activate_at_date, compliance_needed, expires_after_days,
                            finalises_after_days, created_at, type, version)
VALUES (99999, 'ApiTestStudie', 'ApiTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 5, 2, CURRENT_DATE, 'for_probands', 2);

INSERT INTO questions
VALUES (999912, 99999, 'Haben Sie Fieber?', 1, TRUE, '', 2);
INSERT INTO questions
VALUES (999922, 99999, 'Wie fühlen Sie sich?', 1, TRUE, '', 2);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (999912, 999912, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (999922, 999922, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1),
       (999932, 999922, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (999942, 999922, 'Sample id einscannen', 6, 3),
       (999952, 999922, 'Bitte laden sie das Bild hoch', 8, 4),
       (999802, 999922, 'Bitte laden sie das zweite Bild hoch', 8, 5),
       (999812, 999922, 'Bitte laden sie das dritte Bild hoch', 8, 6),
       (999822, 999922, 'Bitte laden sie das das vierte Bild hoch', 8, 7);

INSERT INTO lab_results (id, user_id, status, remark, new_samples_sent)
VALUES ('ANSWERTEST-1234570', 'qtest-proband1', 'new', 'Das PM merkt an: bitte mit Vorsicht genießen!', FALSE);

INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (99996, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-proband1', '08.08.2017', NULL, NULL, 1, 'active'),
       (99997, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-proband1', '08.09.2017', NULL, NULL, 2,
        'inactive'),
       (99998, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-proband1', '08.10.2017', NULL, NULL, 3, 'active'),
       (99999, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-proband1', '08.24.2017', NULL, NULL, 4, 'active');

INSERT INTO answers(questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (99996, 99991, 99991, 1, 'testvalue'),
       (99996, 99992, 99980, 1, '99998'),
       (99996, 99992, 99981, 1, '99999'),
       (99996, 99992, 99982, 1, '99995');

INSERT INTO questionnaires
VALUES (55555, 'ApiTestStudie', 'ApiImageTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE);
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (55555, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'qtest-proband1', '08.08.2017', NULL, NULL, 1,
        'released_once'),
       (55556, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'qtest-proband1', '08.08.2017', NULL, NULL, 1,
        'released_once');

INSERT INTO questions
VALUES (55555, 55555, 'Mach mal n Bild', 1, TRUE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (55555, 55555, '', 8, NULL, NULL, 1);

INSERT INTO user_files(id, user_id, questionnaire_instance_id, answer_option_id, file, file_name)
VALUES (99995, 'qtest-proband1', 55555, 55555,
        '/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99996, 'qtest-proband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99997, 'qtest-proband1', 55556, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99998, 'qtest-proband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99999, 'qtest-proband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg');

-- Q3

INSERT INTO questionnaires
VALUES (7777771, 'ApiTestStudie', 'ApiImageTestQuestionnaire2', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 5, 2, CURRENT_DATE, 'for_research_team');
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (7777771, 'ApiTestStudie', 7777771, 'ApiImageTestQuestionnaire2', 'qtest-proband1', '08.08.2017', NULL, NULL, 1,
        'active');

INSERT INTO questions
VALUES (7777771, 7777771, 'Mach mal n Bild', 1, TRUE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (7777771, 7777771, '', 10, NULL, NULL, 1);




INSERT INTO questionnaire_instances_queued(user_id, questionnaire_instance_id, date_of_queue)
VALUES ('qtest-proband1', 99996, '2018-10-10 11:11:11.200'),
       ('qtest-proband1', 99997, '2018-10-10 11:11:11.400'),
       ('qtest-proband1', 99998, '2018-10-10 11:11:11.300'),
       ('qtest-proband1', 99999, '2018-10-10 11:11:11.100');

INSERT INTO questionnaires
VALUES (888888, 'ApiTestStudi4', 'ApiTestConditionTargetQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht');
INSERT INTO questions
VALUES (888888, 888888, 'Haben Sie Fieber?', 1, TRUE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (888888, 888888, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);

INSERT INTO questionnaires
VALUES (888889, 'ApiTestStudi4', 'ApiTestConditionSourceQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht');
INSERT INTO questions
VALUES (888889, 888889, 'Bedingung auf Ja', 1, TRUE);
INSERT INTO questions
VALUES (888890, 888889, 'Bedingung auf Nein', 2, TRUE);
INSERT INTO questions
VALUES (888891, 888889, 'Frage ohne Unterfrage', 3, FALSE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (888889, 888889, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (888890, 888889, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2),
       (888891, 888890, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (888892, 888890, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2);

INSERT INTO conditions
VALUES ('external', NULL, 888889, NULL, '==', 'Ja;Nein;', 888888, 888888, 123456789, 'OR');
INSERT INTO conditions
VALUES ('external', NULL, 888890, NULL, '\=', 'Ja', 888888, 888888, 123456790, 'AND');
INSERT INTO conditions
VALUES ('internal_last', 888889, NULL, NULL, '\=', 'Ja', 888889, 888889);
INSERT INTO conditions
VALUES ('internal_last', 888891, NULL, NULL, '==', 'Ja', 888889, 888889);

INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status, notifications_scheduled,
                                     progress, release_version, questionnaire_version)
VALUES (100888888, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'qtest-proband4', '08.08.2017',
        '08.08.2017', NULL, 1, 'released_once', NULL, 0, 0, 1),
       (100888889, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'qtest-proband4', '08.15.2017',
        '08.15.2017', '08.15.2017', 2, 'released_twice', NULL, 0, 0, 1),
       (100888890, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'qtest-proband4', '08.22.2017', NULL,
        NULL, 3, 'active', NULL, 0, 0, 1),

       (100888891, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'qtest-proband4', '08.09.2017',
        '08.09.2017', '08.09.2017', 1, 'released_twice', NULL, 0, 0, 1),
       (100888892, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'qtest-proband4', '08.16.2017', NULL,
        NULL, 2, 'active', NULL, 0, 0, 1),
       (100888893, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'qtest-proband4', '08.23.2017', NULL,
        NULL, 3, 'active', NULL, 0, 0, 1),

       (100888894, 'ApiTestStudi4', 888889, 'ApiTestEmptyQuestionQuestionnaire', 'qtest-proband4', '08.23.2017', NULL,
        NULL, 3, 'active', NULL, 0, 0, 1);

INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (100888888, 888888, 888888, 1, 'Ja'),
       (100888889, 888888, 888888, 2, 'Nein'),
       (100888891, 888889, 888889, 1, 'Ja');


INSERT INTO questionnaires
VALUES (777777, 'ApiTestStudi4', 'ApiTestNoDataQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht');
INSERT INTO questions
VALUES (777777, 777777, 'Haben Sie Fieber?', 1, TRUE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (777777, 777777, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO questions
VALUES (777778, 777777, 'Haben Sie Fieber?', 2, TRUE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (777778, 777778, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (777779, 777778, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2);
INSERT INTO questionnaire_instances (id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                     date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (100777777, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'qtest-proband4', '08.08.2017', '08.08.2017',
        NULL, 1, 'released_once'),
       (100777778, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'qtest-proband4', '08.10.2017', NULL, NULL, 2,
        'active');
INSERT INTO conditions
VALUES ('internal_last', NULL, 777777, NULL, '==', 'Ja', 777777, 777777);
INSERT INTO conditions
VALUES ('internal_last', 777778, NULL, NULL, '==', 'Ja', 777777, 777777);
INSERT INTO conditions
VALUES ('internal_last', 777779, NULL, NULL, '==', 'Ja', 777777, 777777);
