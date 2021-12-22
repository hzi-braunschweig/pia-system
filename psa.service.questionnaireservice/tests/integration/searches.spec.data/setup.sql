/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;
-- Studies
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestMultiProbands', 'ApiTestMultiProbands Beschreibung', FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestMultiProfs', 'ApiTestMultiProfs Beschreibung', FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestStudi2', 'ApiTestStudi2 Beschreibung', FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestStudi3', 'ApiTestStudi3 Beschreibung', FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ApiTestStudi4', 'ApiTestStudi4 Beschreibung', FALSE);
INSERT INTO studies(name, description, has_logging_opt_in)
VALUES ('ExportTestStudie', 'ExportTestStudie Beschreibung', FALSE);
INSERT INTO studies(name, description, pm_email, hub_email, status, address, has_rna_samples, sample_prefix,
                    sample_suffix_length, has_logging_opt_in)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung', 'pm@pia.de', 'hub@pia.de', 'active',
        'Studienzentrum des ApiTestStudie für Infektionsforschung<br> ApiTestStudie<br> Api-Test-Str. 1<br> 53111 Bonn<br> Tel.: 0111 1111 1111<br> Fax: 0111 1111 1111<br> Email: ApiTestStudie@ApiTestStudie.de',
        FALSE, 'TESTPREFIX', 5, FALSE);

-- Users
INSERT INTO probands(pseudonym, compliance_labresults, compliance_samples, study)
VALUES ('QExportTestProband1', TRUE, TRUE, 'ApiTestMultiProbands'),
       ('QExportTestProband2', TRUE, TRUE, 'ApiTestMultiProbands'),
       ('QTestMultiProband1', FALSE, FALSE, 'ApiTestMultiProbands'),
       ('QTestMultiProband2', FALSE, FALSE, 'ApiTestMultiProbands'),
       ('QTestMultiProband3', FALSE, FALSE, 'ApiTestMultiProbands'),
       ('QTestMultiProband4', FALSE, FALSE, 'ApiTestMultiProbands'),
       ('QTestMultiProband5', FALSE, FALSE, 'ApiTestMultiProbands'),
       ('QTestStudieProband1', FALSE, FALSE, 'ApiTestStudie'),
       ('QTestStudi2Proband2', FALSE, FALSE, 'ApiTestStudi2'),
       ('QTestStudieProband3', FALSE, FALSE, 'ApiTestStudie'),
       ('QTestStudi4Proband4', FALSE, FALSE, 'ApiTestStudi4'),
       ('QTestStudi4Proband5', FALSE, FALSE, 'ApiTestStudi4');

INSERT INTO accounts(username, password, role)
VALUES ('QExportTestProband1', '', 'Proband'),
       ('QExportTestForscher', '', 'Forscher'),
       ('QTestForscher1', '', 'Forscher'),
       ('QTestForscher2', '', 'Forscher'),
       ('QTestProbandenManager', '', 'ProbandenManager'),
       ('QTestSysAdmin', '', 'SysAdmin'),
       ('QTestUntersuchungsteam', '', 'Untersuchungsteam'),
       ('QTestUntersuchungsteam2', '', 'Untersuchungsteam');

INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestMultiProfs', 'QExportTestForscher', 'write'),
       ('ApiTestMultiProfs', 'QTestForscher1', 'write'),
       ('ApiTestMultiProfs', 'QTestForscher2', 'write'),
       ('ApiTestMultiProfs', 'QTestProbandenManager', 'write'),
       ('ApiTestMultiProfs', 'QTestSysAdmin', 'write'),
       ('ApiTestMultiProfs', 'QTestUntersuchungsteam', 'write'),
       ('ApiTestMultiProfs', 'QTestUntersuchungsteam2', 'write'),
       ('ApiTestStudi2', 'QTestForscher2', 'admin'),
       ('ApiTestStudi2', 'QTestUntersuchungsteam2', 'write'),
       ('ApiTestStudi4', 'QTestForscher2', 'write'),
       ('ApiTestStudie', 'QTestForscher1', 'write'),
       ('ApiTestStudie', 'QTestProbandenManager', 'write'),
       ('ApiTestStudie', 'QTestUntersuchungsteam', 'write'),
       ('ExportTestStudie', 'QExportTestForscher', 'write');

-- Questionnaires
INSERT INTO questionnaires
VALUES (55555, 'ApiTestStudie', 'ApiImageTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE);
INSERT INTO questionnaires
VALUES (666666, 'ExportTestStudie', 'ExportTestQuestionnaire1', 2, 1, 'day', 5, 2, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht');
INSERT INTO questionnaires
VALUES (666667, 'ExportTestStudie', 'ExportTestQuestionnaire2', 2, 0, 'once', 0, 0, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht');
INSERT INTO questionnaires
VALUES (777777, 'ApiTestStudi4', 'ApiTestNoDataQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht');
INSERT INTO questionnaires
VALUES (7777771, 'ApiTestStudie', 'ApiImageTestQuestionnaire2', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 5, 2, CURRENT_DATE, 'for_research_team');
INSERT INTO questionnaires
VALUES (888888, 'ApiTestStudi4', 'ApiTestConditionTargetQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht');
INSERT INTO questionnaires
VALUES (888889, 'ApiTestStudi4', 'ApiTestConditionSourceQuestionnaire', 1, 1, 'week', 1, 365, 3, 'PIA Fragebogen',
        'NeuNachricht', 'AltNachricht');
INSERT INTO questionnaires
VALUES (99999, 'ApiTestStudie', 'ApiTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE);
INSERT INTO questionnaires
VALUES (99999, 'ApiTestStudie', 'ApiTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 5, 2, CURRENT_DATE, 'for_probands', 2);
INSERT INTO questionnaires
VALUES (1234567, 'ApiTestStudie', 'ApiTestQuestionnaire', 1, 1, 'week', 1, 365, 13, 'PIA Fragebogen', 'NeuNachricht',
        'AltNachricht', NULL, NULL, NULL, NULL, TRUE, 1, 1, CURRENT_DATE, 'for_research_team', 1);

INSERT INTO questions (id, questionnaire_id, text, position, is_mandatory, label, questionnaire_version)
VALUES (55555, 55555, 'Mach mal n Bild', 1, TRUE, '', 1),
       (666666, 666666, 'Q1Frage1', 1, FALSE, '', 1),
       (666667, 666666, 'Q1Frage2', 2, FALSE, '', 1),
       (666668, 666667, 'Q2Frage1', 1, FALSE, '', 1),
       (666669, 666667, 'Q2Frage2', 2, FALSE, '', 1),
       (777777, 777777, 'Haben Sie Fieber?', 1, TRUE, '', 1),
       (7777771, 7777771, 'Mach mal n Bild', 1, TRUE, '', 1),
       (777778, 777777, 'Haben Sie Fieber?', 2, TRUE, '', 1),
       (888888, 888888, 'Haben Sie Fieber?', 1, TRUE, '', 1),
       (888889, 888889, 'Bedingung auf Ja', 1, TRUE, '', 1),
       (888890, 888889, 'Bedingung auf Nein', 2, TRUE, '', 1),
       (888891, 888889, 'Frage ohne Unterfrage', 3, FALSE, '', 1),
       (99991, 99999, 'Haben Sie Fieber?', 1, TRUE, '', 1),
       (999912, 99999, 'Haben Sie Fieber?', 1, TRUE, '', 2),
       (99992, 99999, 'Wie fühlen Sie sich?', 1, TRUE, '', 1),
       (999922, 99999, 'Wie fühlen Sie sich?', 1, TRUE, '', 2),
       (12345, 1234567, 'Wie fühlen Sie sich?', 1, TRUE, '', 1);


INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (666668, 666667, 'Q1Frage2Sub1', 3, 1),
       (666669, 666667, 'Q1Frage2Sub2', 4, 2),
       (666672, 666669, 'Q2Frage2Sub1', 3, 1),
       (666673, 666669, 'Q2Frage2Sub2', 5, 2),
       (99980, 99992, 'Bitte laden sie das zweite Bild hoch', 8, 5),
       (999802, 999922, 'Bitte laden sie das zweite Bild hoch', 8, 5),
       (99981, 99992, 'Bitte laden sie das dritte Bild hoch', 8, 6),
       (999812, 999922, 'Bitte laden sie das dritte Bild hoch', 8, 6),
       (99982, 99992, 'Bitte laden sie das das vierte Bild hoch', 8, 7),
       (999822, 999922, 'Bitte laden sie das das vierte Bild hoch', 8, 7),
       (99994, 99992, 'Sample id einscannen', 6, 3),
       (999942, 999922, 'Sample id einscannen', 6, 3),
       (99995, 99992, 'Bitte laden sie das Bild hoch', 8, 4),
       (999952, 999922, 'Bitte laden sie das Bild hoch', 8, 4);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, position)
VALUES (777777, 777777, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (777778, 777778, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (777779, 777778, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2),
       (888888, 888888, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (888889, 888889, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (888890, 888889, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2),
       (888891, 888890, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (888892, 888890, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 2),
       (99991, 99991, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (999912, 999912, '', 1, '{"Ja", "Nein", "Keine Angabe"}', 1),
       (99992, 99992, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1),
       (999922, 999922, 'Kopf?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 1),
       (99993, 99992, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2),
       (999932, 999922, 'Bauch?', 2, '{"Schlecht", "Mittel", "Gut", "Keine Angabe"}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (55555, 55555, '', 8, NULL, NULL, 1),
       (7777771, 7777771, '', 10, NULL, NULL, 1),
       (666666, 666666, 'Q1Frage1Sub1', 1, '{"Ja", "Nein", "Keine Angabe"}', '{1, 0, 2}', 1),
       (666667, 666666, 'Q1Frage1Sub2', 2, '{"Husten", "Schnupfen", "Schmerzen", "Wehwehchen"}', '{1, 2, 3, 4}', 2),
       (666670, 666668, 'Q2Frage1Sub1', 1, '{"Ja", "Nein", "Keine Angabe"}', '{1, 0, 2}', 1),
       (666671, 666668, 'Q2Frage1Sub2', 2, '{"Husten", "Schnupfen", "Schmerzen", "Wehwehchen"}', '{1, 2, 3, 4}', 2),
       (12345, 12345, 'Q2Frage1Sub2', 10, '{}', '{}', 1);

-- Questionnaire Instances
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (100777777, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'QTestStudi4Proband4', '2017-08-08',
        '2017-08-08',
        NULL, 1, 'released_once'),
       (100777778, 'ApiTestStudi4', 777777, 'ApiTestNoDataQuestionnaire', 'QTestStudi4Proband4', '2017-08-10', NULL,
        NULL, 2,
        'active'),
       (100888888, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestStudi4Proband4', '2017-08-08',
        '2017-08-08', NULL, 1, 'released_once'),
       (100888889, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestStudi4Proband4', '2017-08-15',
        '2017-08-15', '2017-08-15', 2, 'released_twice'),
       (100888890, 'ApiTestStudi4', 888888, 'ApiTestConditionTargetQuestionnaire', 'QTestStudi4Proband4', '2017-08-22',
        NULL,
        NULL, 3, 'active'),
       (100888891, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestStudi4Proband4', '2017-08-09',
        '2017-08-09', '2017-08-09', 1, 'released_twice'),
       (100888892, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestStudi4Proband4', '2017-08-16',
        NULL,
        NULL, 2, 'active'),
       (100888893, 'ApiTestStudi4', 888889, 'ApiTestConditionSourceQuestionnaire', 'QTestStudi4Proband4', '2017-08-23',
        NULL,
        NULL, 3, 'active'),
       (100888894, 'ApiTestStudi4', 888889, 'ApiTestEmptyQuestionQuestionnaire', 'QTestStudi4Proband4', '2017-08-23',
        NULL,
        NULL, 3, 'active'),
       (55555, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'QTestStudieProband1', '2017-08-08', NULL, NULL, 1,
        'released_once'),
       (55556, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'QTestStudieProband1', '2017-08-08', NULL, NULL, 1,
        'released_once'),
       (666666, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband1', '2017-08-08',
        '2017-08-10 04:30:00', NULL, 1, 'released_once'),
       (666667, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband1', '2017-08-09',
        '2017-08-11 04:30:00', NULL, 2, 'released_once'),
       (666668, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband1', '2017-08-10',
        '2017-08-12 04:30:00', NULL, 3, 'released_once'),
       (666669, 'ExportTestStudie', 666667, 'ExportTestQuestionnaire2', 'QExportTestProband1', '2017-08-08',
        '2017-08-10 04:30:00', '2017-08-11 07:40:00', 1, 'released_twice'),
       (666671, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband2', '2017-08-08',
        '2017-08-10 04:30:00', NULL, 1, 'released_once'),
       (666672, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband2', '2017-08-09', NULL, NULL,
        2, 'active'),
       (666673, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'QExportTestProband2', '2017-08-10', NULL, NULL,
        3, 'active'),
       (666674, 'ExportTestStudie', 666667, 'ExportTestQuestionnaire2', 'QExportTestProband2', '2017-08-08', NULL, NULL,
        1, 'active'),
       (7777771, 'ApiTestStudie', 7777771, 'ApiImageTestQuestionnaire2', 'QTestStudieProband1', '2017-08-08', NULL,
        NULL, 1,
        'active'),
       (99995, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-07', NULL, NULL, 5,
        'released_once'),
       (99996, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-08', NULL, NULL, 1,
        'active'),
       (99997, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-09', NULL, NULL, 2,
        'inactive'),
       (99998, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-10', NULL, NULL, 3,
        'active'),
       (99999, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'QTestStudieProband1', '2017-08-24', NULL, NULL, 4,
        'active');

COMMIT;
