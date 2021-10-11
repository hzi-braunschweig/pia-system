BEGIN;

INSERT INTO users(username, password, role, first_logged_in_at, compliance_labresults, compliance_samples)
VALUES ('QTestProband1', '', 'Proband', NULL, TRUE, TRUE),
       ('QTestProband2', '', 'Proband', NULL, TRUE, TRUE),
       ('QTestProband3', '', 'Proband', NULL, FALSE, FALSE),
       ('QTestProband4', '', 'Proband', NULL, TRUE, TRUE),
       ('QTestProband5', '', 'Proband', NULL, TRUE, TRUE);

INSERT INTO users(username, password, role)
VALUES ('QTestForscher1', '', 'Forscher'),
       ('QTestForscher2', '', 'Forscher'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestUntersuchungsteam2', '', 'Untersuchungsteam'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestSysAdmin', '', 'SysAdmin');

INSERT INTO studies(name, description, pm_email, hub_email, status, address, has_rna_samples, sample_prefix,
                    sample_suffix_length, has_logging_opt_in)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung', 'pm@pia.de', 'hub@pia.de', 'active',
        'Studienzentrum des ApiTestStudie für Infektionsforschung<br> ApiTestStudie<br> Api-Test-Str. 1<br> 53111 Bonn<br> Tel.: 0111 1111 1111<br> Fax: 0111 1111 1111<br> Email: ApiTestStudie@ApiTestStudie.de',
        FALSE, 'TESTPREFIX', 5, FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestStudi2', 'ApiTestStudi2 Beschreibung', FALSE),
       ('ApiTestStudi3', 'ApiTestStudi3 Beschreibung', FALSE),
       ('ApiTestStudi4', 'ApiTestStudi4 Beschreibung', FALSE),

       ('ApiTestMultiProbands', 'ApiTestMultiProbands Beschreibung', FALSE),
       ('ApiTestMultiProfs', 'ApiTestMultiProfs Beschreibung', FALSE);

INSERT INTO study_welcome_text(study_id, welcome_text, language)
VALUES ('ApiTestStudie', '# Welcome to our study! We are happy to have you with us!', 'de_DE');
INSERT INTO study_welcome_text(study_id, welcome_text, language)
VALUES ('ApiTestStudi2', 'Welcome <img src=x onerror=alert(1)//> home !', 'de_DE');

INSERT INTO questionnaires
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

INSERT INTO questionnaires
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
VALUES ('ANSWERTEST-1234570', 'QTestProband1', 'new', 'Das PM merkt an: bitte mit Vorsicht genießen!', FALSE);

INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (99996, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestProband1', '08.08.2017', NULL, NULL, 1, 'active'),
       (99997, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestProband1', '08.09.2017', NULL, NULL, 2,
        'inactive'),
       (99998, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestProband1', '08.10.2017', NULL, NULL, 3, 'active'),
       (99999, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestProband1', '08.24.2017', NULL, NULL, 4, 'active');

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
VALUES (55555, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'QTestProband1', '08.08.2017', NULL, NULL, 1,
        'released_once'),
       (55556, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'QTestProband1', '08.08.2017', NULL, NULL, 1,
        'released_once');

INSERT INTO questions
VALUES (55555, 55555, 'Mach mal n Bild', 1, TRUE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (55555, 55555, '', 8, NULL, NULL, 1);

INSERT INTO user_files(id, user_id, questionnaire_instance_id, answer_option_id, file, file_name)
VALUES (99995, 'QTestProband1', 55555, 55555,
        '/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99996, 'QTestProband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99997, 'QTestProband1', 55556, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99998, 'QTestProband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99999, 'QTestProband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg');



INSERT INTO questionnaires
VALUES (7777771, 'ApiTestStudie', 'ApiImageTestQuestionnaire2', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 5, 2, CURRENT_DATE, 'for_research_team');
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (7777771, 'ApiTestStudie', 7777771, 'ApiImageTestQuestionnaire2', 'QTestProband1', '08.08.2017', NULL, NULL, 1,
        'active');

INSERT INTO questions
VALUES (7777771, 7777771, 'Mach mal n Bild', 1, TRUE);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (7777771, 7777771, '', 10, NULL, NULL, 1);
INSERT INTO user_files
VALUES (7777771, 'QTestProband1', 7777771, 7777771,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'file.dat');



INSERT INTO questionnaire_instances_queued(user_id, questionnaire_instance_id, date_of_queue)
VALUES ('QTestProband1', 99996, '2018-10-10 11:11:11.200'),
       ('QTestProband1', 99997, '2018-10-10 11:11:11.400'),
       ('QTestProband1', 99998, '2018-10-10 11:11:11.300'),
       ('QTestProband1', 99999, '2018-10-10 11:11:11.100');

INSERT INTO study_users
VALUES ('ApiTestStudie', 'QTestProband1', 'read'),
       ('ApiTestStudie', 'QTestProband3', 'read'),
       ('ApiTestStudi4', 'QTestProband4', 'read'),
       ('ApiTestStudi4', 'QTestProband5', 'read'),
       ('ApiTestStudie', 'QTestForscher1', 'write'),

       ('ApiTestStudi4', 'QTestForscher2', 'write'),
       ('ApiTestStudie', 'QTestUntersuchungsteam', 'write'),
       ('ApiTestStudi2', 'QTestUntersuchungsteam2', 'write'),
       ('ApiTestStudie', 'QTestProbandenManager', 'write'),

       ('ApiTestStudi2', 'QTestProband2', 'read'),
       ('ApiTestStudi2', 'QTestForscher2', 'admin'),


       ('ApiTestMultiProbands', 'QTestProband1', 'read'),
       ('ApiTestMultiProbands', 'QTestProband2', 'read'),
       ('ApiTestMultiProbands', 'QTestProband3', 'read'),
       ('ApiTestMultiProbands', 'QTestProband4', 'read'),
       ('ApiTestMultiProbands', 'QTestProband5', 'read'),

       ('ApiTestMultiProfs', 'QTestForscher1', 'write'),
       ('ApiTestMultiProfs', 'QTestForscher2', 'write'),
       ('ApiTestMultiProfs', 'QTestUntersuchungsteam', 'write'),
       ('ApiTestMultiProfs', 'QTestUntersuchungsteam2', 'write'),
       ('ApiTestMultiProfs', 'QTestProbandenManager', 'write'),
       ('ApiTestMultiProfs', 'QTestSysAdmin', 'write');

INSERT INTO pending_study_changes(id, requested_by, requested_for, study_id, description_from, description_to,
                                  has_rna_samples_from, has_rna_samples_to, sample_prefix_from, sample_prefix_to,
                                  sample_suffix_length_from, sample_suffix_length_to, has_answers_notify_feature_from,
                                  has_answers_notify_feature_to, has_answers_notify_feature_by_mail_from,
                                  has_answers_notify_feature_by_mail_to, has_four_eyes_opposition_from,
                                  has_four_eyes_opposition_to, has_partial_opposition_from, has_partial_opposition_to,
                                  has_total_opposition_from, has_total_opposition_to, has_compliance_opposition_from,
                                  has_compliance_opposition_to, pseudonym_prefix_from, pseudonym_prefix_to,
                                  pseudonym_suffix_length_from, pseudonym_suffix_length_to, has_logging_opt_in_from,
                                  has_logging_opt_in_to)
VALUES (88888888, 'QTestForscher1', 'QTestForscher2', 'ApiTestMultiProfs', 'ApiTestMultiProfs Beschreibung',
        'ApiTestMultiProfs Beschreibung Changed', FALSE, TRUE, NULL, NULL, 0, 0, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE,
        FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, FALSE, TRUE, NULL, NULL, FALSE, TRUE);

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
VALUES (100888888, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestProband4', '08.08.2017',
        '08.08.2017', NULL, 1, 'released_once', NULL, 0, 0, 1),
       (100888889, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestProband4', '08.15.2017',
        '08.15.2017', '08.15.2017', 2, 'released_twice', NULL, 0, 0, 1),
       (100888890, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestProband4', '08.22.2017', NULL,
        NULL, 3, 'active', NULL, 0, 0, 1),

       (100888891, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestProband4', '08.09.2017',
        '08.09.2017', '08.09.2017', 1, 'released_twice', NULL, 0, 0, 1),
       (100888892, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestProband4', '08.16.2017', NULL,
        NULL, 2, 'active', NULL, 0, 0, 1),
       (100888893, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestProband4', '08.23.2017', NULL,
        NULL, 3, 'active', NULL, 0, 0, 1),

       (100888894, 'ApiTestStudi4', 888889, 'ApiTestEmptyQuestionQuestionnaire', 'QTestProband4', '08.23.2017', NULL,
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
VALUES (100777777, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'QTestProband4', '08.08.2017', '08.08.2017',
        NULL, 1, 'released_once'),
       (100777778, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'QTestProband4', '08.10.2017', NULL, NULL, 2,
        'active');
INSERT INTO conditions
VALUES ('internal_last', NULL, 777777, NULL, '==', 'Ja', 777777, 777777);
INSERT INTO conditions
VALUES ('internal_last', 777778, NULL, NULL, '==', 'Ja', 777777, 777777);
INSERT INTO conditions
VALUES ('internal_last', 777779, NULL, NULL, '==', 'Ja', 777777, 777777);

INSERT INTO users
VALUES ('QExportTestProband1',
        '8225433d40a33c8cad99d05697c599f5aad03bbf7f74a87a0a19dc5f01cd831fd73efc5ab4a8bc37ad994ad05bd5390821fc7a23d3cf7f9a1ac0e0472a7dce0e',
        'Proband', NULL);
INSERT INTO users
VALUES ('QExportTestProband2',
        '8225433d40a33c8cad99d05697c599f5aad03bbf7f74a87a0a19dc5f01cd831fd73efc5ab4a8bc37ad994ad05bd5390821fc7a23d3cf7f9a1ac0e0472a7dce0e',
        'Proband', NULL);
INSERT INTO users
VALUES ('QExportTestForscher',
        '9dd01c80bb400e844cba017d2c1a70ac4a13f890fd39d19cbe0b05a9b6cc5805c9b1e8003d41123144db039df6cb9ad1383d3a387a55776105c89c94c92c5e45',
        'Forscher', NULL);

INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ExportTestStudie', 'ExportTestStudie Beschreibung', FALSE);

INSERT INTO questionnaires
VALUES (666666, 'ExportTestStudie', 'ExportTestQuestionnaire1', 2, 1, 'day', 5, 2, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht');
INSERT INTO questionnaires
VALUES (666667, 'ExportTestStudie', 'ExportTestQuestionnaire2', 2, 0, 'once', 0, 0, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht');

INSERT INTO questions(id, questionnaire_id, text, position, is_mandatory)
VALUES (666666, 666666, 'Q1Frage1', 1, FALSE),
       (666667, 666666, 'Q1Frage2', 2, FALSE),
       (666668, 666667, 'Q2Frage1', 1, FALSE),
       (666669, 666667, 'Q2Frage2', 2, FALSE);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (666666, 666666, 'Q1Frage1Sub1', 1, '{"Ja", "Nein", "Keine Angabe"}', '{1, 0, 2}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (666667, 666666, 'Q1Frage1Sub2', 2, '{"Husten", "Schnupfen", "Schmerzen", "Wehwehchen"}', '{1, 2, 3, 4}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (666668, 666667, 'Q1Frage2Sub1', 3, 1),
       (666669, 666667, 'Q1Frage2Sub2', 4, 2);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (666670, 666668, 'Q2Frage1Sub1', 1, '{"Ja", "Nein", "Keine Angabe"}', '{1, 0, 2}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (666671, 666668, 'Q2Frage1Sub2', 2, '{"Husten", "Schnupfen", "Schmerzen", "Wehwehchen"}', '{1, 2, 3, 4}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (666672, 666669, 'Q2Frage2Sub1', 3, 1),
       (666673, 666669, 'Q2Frage2Sub2', 5, 2);

INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (666666, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband1', '08.08.2017',
        '10.08.2017 04:30:00', NULL, 1, 'released_once'),
       (666667, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband1', '09.08.2017',
        '11.08.2017 04:30:00', NULL, 2, 'released_once'),
       (666668, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband1', '10.08.2017',
        '12.08.2017 04:30:00', NULL, 3, 'released_once'),
       (666669, 'ExportTestStudie', 666667, 'ExportTestQuestionnaire2', 'QExportTestProband1', '08.08.2017',
        '10.08.2017 04:30:00', '11.08.2017 07:40:00', 1, 'released_twice'),

       (666671, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband2', '08.08.2017',
        '10.08.2017 04:30:00', NULL, 1, 'released_once'),
       (666672, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband2', '09.08.2017', NULL, NULL,
        2, 'active'),
       (666673, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband2', '10.08.2017', NULL, NULL,
        3, 'active'),
       (666674, 'ExportTestStudie', 666667, 'ExportTestQuestionnaire2', 'QExportTestProband2', '08.08.2017', NULL, NULL,
        1, 'active');

INSERT INTO answers
VALUES (666666, 666666, 666666, 1, 'Ja'),
       (666666, 666666, 666667, 1, 'Husten;Schnupfen'),
       (666666, 666667, 666668, 1, '42'),
       (666666, 666667, 666669, 1, 'Mir geht es eigentlich nicht so gut...'),

       (666667, 666666, 666666, 1, 'Nein'),
       (666667, 666666, 666667, 1, 'Husten;'),
       (666667, 666667, 666668, 1, '37'),
       (666667, 666667, 666669, 1, 'Mir geht es eigentlich schon besser...'),

       (666668, 666666, 666666, 1, 'Nein'),
       (666668, 666666, 666667, 1, 'Husten;'),
       (666668, 666667, 666668, 1, '37'),
       (666668, 666667, 666669, 1, 'Mir geht es eigentlich schon besser...'),

       (666669, 666668, 666670, 1, 'Nein'),
       (666669, 666668, 666671, 1, 'Husten;'),
       (666669, 666669, 666672, 1, '37'),
       (666669, 666669, 666673, 1, '12.08.2017'),

       (666669, 666668, 666670, 2, 'Ja'),
       (666669, 666668, 666671, 2, 'Husten;'),
       (666669, 666669, 666672, 2, '38'),
       (666669, 666669, 666673, 2, '2017-08-13'),


       (666671, 666666, 666666, 1, 'Ja'),
       (666671, 666666, 666667, 1, 'Husten;Schnupfen'),
       (666671, 666667, 666668, 1, '42'),
       (666671, 666667, 666669, 1, 'Mir geht es eigentlich nicht so gut...'),

       (666672, 666666, 666666, 1, 'Nein'),
       (666672, 666666, 666667, 1, 'Husten;'),
       (666672, 666667, 666668, 1, '37'),
       (666672, 666667, 666669, 1, 'Mir geht es eigentlich schon besser...'),

       (666673, 666666, 666666, 1, 'Nein'),
       (666673, 666666, 666667, 1, 'Husten;'),
       (666673, 666667, 666668, 1, '37'),
       (666673, 666667, 666669, 1, 'Mir geht es eigentlich schon besser...'),

       (666674, 666668, 666670, 1, 'Nein'),
       (666674, 666668, 666671, 1, 'Husten;'),
       (666674, 666669, 666672, 1, '37'),
       (666674, 666669, 666673, 1, '2017-08-12');

INSERT INTO study_users (study_id, user_id, access_level)
VALUES ('ExportTestStudie', 'QExportTestProband1', 'read'),
       ('ExportTestStudie', 'QExportTestProband2', 'read'),
       ('ExportTestStudie', 'QExportTestForscher', 'write'),

       ('ApiTestMultiProbands', 'QExportTestProband1', 'read'),
       ('ApiTestMultiProbands', 'QExportTestProband2', 'read'),

       ('ApiTestMultiProfs', 'QExportTestForscher', 'write');

COMMIT;
