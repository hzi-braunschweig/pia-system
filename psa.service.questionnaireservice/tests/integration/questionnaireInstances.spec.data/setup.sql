/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;

-- Studies
INSERT INTO studies(name, description)
VALUES ('ApiTestMultiProfs', 'ApiTestMultiProfs Beschreibung'),
       ('ApiTestStudie', 'ApiTestStudie Beschreibung'),
       ('ApiTestStudi2', 'ApiTestStudi2 Beschreibung'),
       ('ApiTestStudi4', 'ApiTestStudi4 Beschreibung');

-- Users
INSERT INTO probands(pseudonym, compliance_labresults, compliance_samples, study)
VALUES ('QTestStudieProband1', FALSE, FALSE, 'ApiTestStudie'),
       ('QTestStudi2Proband2', FALSE, FALSE, 'ApiTestStudi2'),
       ('QTestStudi4Proband3', FALSE, FALSE, 'ApiTestStudi4'),
       ('QTestStudieProband4', FALSE, FALSE, 'ApiTestStudie');

INSERT INTO accounts(username, password, role)
VALUES ('QTestForscher1', '', 'Forscher'),
       ('QTestForscher2', '', 'Forscher'),
       ('QTestStudieProband1', '', 'Proband'),
       ('QTestStudi2Proband2', '', 'Proband'),
       ('QTestStudi4Proband3', '', 'Proband'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestUntersuchungsteam2', '', 'Untersuchungsteam');

INSERT INTO study_users
VALUES ('ApiTestMultiProfs', 'QTestForscher1', 'write'),
       ('ApiTestMultiProfs', 'QTestForscher2', 'write'),
       ('ApiTestMultiProfs', 'QTestProbandenManager', 'write'),
       ('ApiTestMultiProfs', 'QTestUntersuchungsteam', 'write'),
       ('ApiTestMultiProfs', 'QTestUntersuchungsteam2', 'write'),
       ('ApiTestStudi2', 'QTestForscher2', 'admin'),
       ('ApiTestStudi2', 'QTestUntersuchungsteam2', 'write'),
       ('ApiTestStudi4', 'QTestForscher2', 'write'),
       ('ApiTestStudie', 'QTestForscher1', 'write'),
       ('ApiTestStudie', 'QTestProbandenManager', 'write'),
       ('ApiTestStudie', 'QTestUntersuchungsteam', 'write');

-- Questionnaires
INSERT INTO questionnaires VALUES (55555, 'ApiTestStudie', 'ApiImageTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', null, null, null, null, true);
INSERT INTO questionnaires VALUES (777777, 'ApiTestStudi4', 'ApiTestNoDataQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht');
INSERT INTO questionnaires VALUES (7777771, 'ApiTestStudie', 'ApiImageTestQuestionnaire2', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', null, null, null, null, true, 5, 2, CURRENT_DATE, 'for_research_team');
INSERT INTO questionnaires VALUES (888888, 'ApiTestStudi4', 'ApiTestConditionTargetQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht');
INSERT INTO questionnaires VALUES (888889, 'ApiTestStudi4', 'ApiTestConditionSourceQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht');
INSERT INTO questionnaires VALUES (99999, 'ApiTestStudie', 'ApiTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', null, null, null, null, true);
INSERT INTO questionnaires VALUES (99999, 'ApiTestStudie', 'ApiTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', null, null, null, null, true, 5, 2, CURRENT_DATE, 'for_probands', 2);
INSERT INTO questionnaires VALUES (1234567, 'ApiTestStudie', 'ApiTestQuestionnaire', 1, 1, 'week', 1, 365, 13, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', null, null, null, null, true, 1, 1, CURRENT_DATE, 'for_research_team', 1);

INSERT INTO questions VALUES (55555, 55555, 'Mach mal n Bild', 1, true);
INSERT INTO questions VALUES (777777, 777777, 'Haben Sie Fieber?', 1, true);
INSERT INTO questions VALUES (7777771, 7777771, 'Mach mal n Bild', 1, true);
INSERT INTO questions VALUES (777778, 777777, 'Haben Sie Fieber?', 2, true);
INSERT INTO questions VALUES (888888, 888888, 'Haben Sie Fieber?', 1, true);
INSERT INTO questions VALUES (888889, 888889, 'Bedingung auf Ja', 1, true);
INSERT INTO questions VALUES (888890, 888889, 'Bedingung auf Nein', 2, true);
INSERT INTO questions VALUES (888891, 888889, 'Frage ohne Unterfrage', 3, false);
INSERT INTO questions VALUES (99991, 99999, 'Haben Sie Fieber?', 1, true);
INSERT INTO questions VALUES (999912, 99999, 'Haben Sie Fieber?', 1, true, '', 2);
INSERT INTO questions VALUES (99992, 99999, 'Wie fühlen Sie sich?', 1, true);
INSERT INTO questions VALUES (999922, 99999, 'Wie fühlen Sie sich?', 1, true, '', 2);
INSERT INTO questions VALUES (12345, 1234567, 'Wie fühlen Sie sich?', 1, true, '', 1);


INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (99980, 99992, 'Bitte laden sie das zweite Bild hoch', 8, 5);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (999802, 999922, 'Bitte laden sie das zweite Bild hoch', 8, 5);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (99981, 99992, 'Bitte laden sie das dritte Bild hoch', 8, 6);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (999812, 999922, 'Bitte laden sie das dritte Bild hoch', 8, 6);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (99982, 99992, 'Bitte laden sie das das vierte Bild hoch', 8, 7);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (999822, 999922, 'Bitte laden sie das das vierte Bild hoch', 8, 7);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (99994, 99992, 'Sample id einscannen', 6, 3);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (999942, 999922, 'Sample id einscannen', 6, 3);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (99995, 99992, 'Bitte laden sie das Bild hoch', 8, 4);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (999952, 999922, 'Bitte laden sie das Bild hoch', 8, 4);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (777777, 777777, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (777778, 777778, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (777779, 777778, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (888888, 888888, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (888889, 888889, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (888890, 888889, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (888891, 888890, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (888892, 888890, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (99991, 99991, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (999912, 999912, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (99992, 99992, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (999922, 999922, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (99993, 99992, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (999932, 999922, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (55555, 55555, '', 8, NULL, NULL, 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (7777771, 7777771, '', 10, NULL, NULL, 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (12345, 12345, 'Q2Frage1Sub2', 10, '{}', '{}', 1);

-- Conditions
INSERT INTO conditions
VALUES ('external', NULL, 888889, NULL, '==', 'Ja;Nein;', 888888, 888888, 123456789, 'OR');
INSERT INTO conditions
VALUES ('external', NULL, 888890, NULL, '\=', 'Ja', 888888, 888888, 123456790, 'AND');
INSERT INTO conditions
VALUES ('internal_last', 777778, NULL, NULL, '==', 'Ja', 777777, 777777);
INSERT INTO conditions
VALUES ('internal_last', 777779, NULL, NULL, '==', 'Ja', 777777, 777777);
INSERT INTO conditions
VALUES ('internal_last', 888889, NULL, NULL, '\=', 'Ja', 888889, 888889);
INSERT INTO conditions
VALUES ('internal_last', 888891, NULL, NULL, '==', 'Ja', 888889, 888889);
INSERT INTO conditions
VALUES ('internal_last', NULL, 777777, NULL, '==', 'Ja', 777777, 777777);

-- Questionnaire Instances
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (100777777, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'QTestStudi4Proband3', '2017-08-08', '2017-08-08',
        NULL, 1, 'released_once'),
       (100777778, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'QTestStudi4Proband3', '2017-08-10', NULL, NULL, 2,
        'active'),
       (100888888, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestStudi4Proband3', '2017-08-08',
        '2017-08-08', NULL, 1, 'released_once'),
       (100888889, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestStudi4Proband3', '2017-08-15',
        '2017-08-15', '2017-08-15', 2, 'released_twice'),
       (100888890, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestStudi4Proband3', '2017-08-22', NULL,
        NULL, 3, 'active'),
       (100888891, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestStudi4Proband3', '2017-08-09',
        '2017-08-09', '2017-08-09', 1, 'released_twice'),
       (100888892, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestStudi4Proband3', '2017-08-16', NULL,
        NULL, 2, 'active'),
       (100888893, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestStudi4Proband3', '2017-08-23', NULL,
        NULL, 3, 'active'),
       (100888894, 'ApiTestStudi4', 888889, 'ApiTestEmptyQuestionQuestionnaire', 'QTestStudi4Proband3', '2017-08-23', NULL,
        NULL, 3, 'active'),
       (55555, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'QTestStudieProband1', '2017-08-08', NULL, NULL, 1,
        'released_once'),
       (55556, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'QTestStudieProband1', '2017-08-08', NULL, NULL, 1,
        'released_once'),
       (7777771, 'ApiTestStudie', 7777771, 'ApiImageTestQuestionnaire2', 'QTestStudieProband1', '2017-08-08', NULL, NULL, 1,
        'active'),
       (99995, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-07', NULL, NULL, 5,
        'released_once'),
       (99996, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-08', NULL, NULL, 1, 'active'),
       (99997, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-09', NULL, NULL, 2,
        'inactive'),
       (99998, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-10', NULL, NULL, 3, 'active'),
       (99999, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-24', NULL, NULL, 4, 'active');
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status,
                                    progress)
VALUES (1234567, 'ApiTestStudie', 1234567, 'ApiTestQuestionnaire', 'QTestStudieProband4', '2017-08-24', NULL, NULL,
        1, 'active', 1);

INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (100888888, 888888, 888888, 1, 'Ja'),
       (100888889, 888888, 888888, 2, 'Nein'),
       (100888891, 888889, 888889, 1, 'Ja'),
       (99996, 99991, 99991, 1, 'testvalue'),
       (99996, 99992, 99980, 1, '99998'),
       (99996, 99992, 99981, 1, '99999'),
       (99996, 99992, 99982, 1, '99995');

COMMIT;
