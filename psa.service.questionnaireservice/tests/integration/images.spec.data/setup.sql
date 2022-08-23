/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

BEGIN;

-- Studies
INSERT INTO studies(name, description)
VALUES ('ApiTestStudie', 'ApiTestStudie Beschreibung'),
       ('ApiTestStudi2', 'ApiTestStudi2 Beschreibung'),
       ('ApiTestStudi4', 'ApiTestStudi4 Beschreibung'),
       ('ApiTestMultiProfs', 'ApiTestMultiProfs Beschreibung');

-- Users
INSERT INTO probands(pseudonym, compliance_labresults, compliance_samples, study)
VALUES ('qtest-studie-proband1', FALSE, FALSE, 'ApiTestStudie'),
       ('qtest-studi2-proband', FALSE, FALSE, 'ApiTestStudi2');

INSERT INTO study_users(study_id, user_id, access_level)
VALUES ('ApiTestMultiProfs', 'qtest-forscher1', 'write'),
       ('ApiTestMultiProfs', 'qtest-forscher2', 'write'),
       ('ApiTestMultiProfs', 'qtest-untersuchungsteam', 'write'),
       ('ApiTestMultiProfs', 'qtest-untersuchungsteam2', 'write'),
       ('ApiTestStudi2', 'qtest-forscher2', 'admin'),
       ('ApiTestStudi2', 'qtest-untersuchungsteam2', 'write'),
       ('ApiTestStudi4', 'qtest-forscher2', 'write'),
       ('ApiTestStudie', 'qtest-forscher1', 'write'),
       ('ApiTestStudie', 'qtest-untersuchungsteam', 'write');

-- Questionnaires
INSERT INTO questionnaires(id, study_id, name, no_questions, cycle_amount, cycle_unit, activate_after_days, deactivate_after_days, notification_tries, notification_title, notification_body_new, notification_body_in_progress, type)
VALUES (55555, 'ApiTestStudie', 'ApiImageTestQuestionnaire', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', 'for_probands'),
       (7777771, 'ApiTestStudie', 'ApiImageTestQuestionnaire2', 2, 1, 'week', 1, 365, 3, 'PIA Fragebogen', 'NeuNachricht', 'AltNachricht', 'for_research_team');

INSERT INTO questions(id, questionnaire_id, text, position, is_mandatory)
VALUES (55555, 55555, 'Mach mal n Bild', 1, true),
       (7777771, 7777771, 'Mach mal n Bild', 1, true);

INSERT INTO answer_options(id, question_id, text, answer_type_id, values, values_code, position)
VALUES (55555, 55555, '', 8, NULL, NULL, 1),
       (7777771, 7777771, '', 10, NULL, NULL, 1);

-- Questionnaire Instances
INSERT INTO questionnaire_instances(id, study_id, questionnaire_id, questionnaire_name, user_id, date_of_issue,
                                    date_of_release_v1, date_of_release_v2, cycle, status)
VALUES (55555, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'qtest-studie-proband1', '2017-08-08', NULL, NULL, 1,
        'released_once'),
       (55556, 'ApiTestStudie', 55555, 'ApiImageTestQuestionnaire', 'qtest-studie-proband1', '2017-08-08', NULL, NULL, 1,
        'released_once'),
       (7777771, 'ApiTestStudie', 7777771, 'ApiImageTestQuestionnaire2', 'qtest-studie-proband1', '2017-08-08', NULL, NULL, 1,
        'active');

INSERT INTO user_files(id, user_id, questionnaire_instance_id, answer_option_id, file, file_name)
VALUES (7777771, 'qtest-studie-proband1', 7777771, 7777771,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'file.dat'),
       (99995, 'qtest-studie-proband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99996, 'qtest-studie-proband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99997, 'qtest-studie-proband1', 55556, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99998, 'qtest-studie-proband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg'),
       (99999, 'qtest-studie-proband1', 55555, 55555,
        'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAAJ5JREFUOI3d0sEJwlAQBNCnVag3CSLYRJCAFqJV6EEb0WAndiGCKDmoZegh/xAC+clVB/YwCzOzDMvfYooT3nghx6SreIYbUgwwxBz3YNyafKvwHfYV/kBSFfRrBhusIgFrbGMGC1xruzRcAhcsYwYf9Cr8jKK2iyJXFtaEDIeYwUTZdhMKjNuumCrbzjAKkwVx519IcMQzzKFL8o/iCw90Gk24qnziAAAAAElFTkSuQmCC',
        'clock.svg');

COMMIT;
