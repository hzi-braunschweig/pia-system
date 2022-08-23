/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;
-- Studies
INSERT INTO studies(name, description, has_logging_opt_in) VALUES ('ExportTestStudie', 'ExportTestStudie Beschreibung', false);

-- Users
INSERT INTO probands(pseudonym, compliance_labresults, compliance_samples, study)
VALUES ('qtest-exportproband2', TRUE, TRUE, 'ExportTestStudie');

-- Questionnaires
INSERT INTO questionnaires VALUES (666666, 'ExportTestStudie', 'ExportTestQuestionnaire1', 2, 1, 'day', 5, 2, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht');

INSERT INTO questions(id, questionnaire_id, text, position, is_mandatory)
VALUES (666666, 666666, 'Q1Frage1', 1, false),
       (666667, 666666, 'Q1Frage2', 2, false);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (666666, 666666, 'Q1Frage1Sub1', 1, '{"Ja", "Nein", "Keine Angabe"}', '{1, 0, 2}', 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (666667, 666666, 'Q1Frage1Sub2', 2, '{"Husten", "Schnupfen", "Schmerzen", "Wehwehchen"}', '{1, 2, 3, 4}', 2);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (666668, 666667, 'Q1Frage2Sub1', 3, 1);
INSERT INTO answer_options(id, question_id, text, answer_type_id, position)
VALUES (666669, 666667, 'Q1Frage2Sub2', 4, 2);

-- Questionnaire Instances
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue, date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (666671, 'ExportTestStudie', 666666, 'ExportTestQuestionnaire1', 'qtest-exportproband2', '2017-08-08', '2017-08-10 04:30:00', NULL, 1, 'released_once');

-- Answers
INSERT INTO answers (questionnaire_instance_id, question_id, answer_option_id, versioning, value)
VALUES (666671, 666666, 666666, 1, 'Ja'),
       (666671, 666666, 666667, 1, 'Husten;Schnupfen'),
       (666671, 666667, 666668, 1, '42'),
       (666671, 666667, 666669, 1, 'Mir geht es eigentlich nicht so gut...');

COMMIT;
