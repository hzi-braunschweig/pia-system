/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;

-- Studies
INSERT INTO studies(name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung'),
       ('ApiTestStudi2', 'ApiTestStudi2 Beschreibung');

-- Users
INSERT INTO probands(pseudonym, compliance_labresults, compliance_samples, study)
VALUES ('qtest-studie-proband1', FALSE, FALSE, 'ApiTestStudie'),
       ('qtest-studi2-proband', FALSE, FALSE, 'ApiTestStudi2');

INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestStudie', 'qtest-forscher1', 'write');

-- Questionnaires
INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress)
VALUES (99999, 'ApiTestStudie', 'ApiTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht');

-- Questionnaire Instances
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue, date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (99996, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-studie-proband1', '2017-08-08', NULL, NULL, 1, 'active'),
       (99997, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-studie-proband1', '2017-08-09', NULL, NULL, 2, 'inactive'),
       (99998, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-studie-proband1', '2017-08-10', NULL, NULL, 3, 'active'),
       (99999, 'ApiTestStudie', 99999, 'ApiTestQuestionnaire', 'qtest-studie-proband1', '2017-08-24', NULL, NULL, 4, 'active');

INSERT INTO questionnaire_instances_queued(user_id, questionnaire_instance_id, date_of_queue)
VALUES ('qtest-studie-proband1', 99996, '2018-10-10 11:11:11.200'),
       ('qtest-studie-proband1', 99997, '2018-10-10 11:11:11.400'),
       ('qtest-studie-proband1', 99998, '2018-10-10 11:11:11.300'),
       ('qtest-studie-proband1', 99999, '2018-10-10 11:11:11.100');

COMMIT;
