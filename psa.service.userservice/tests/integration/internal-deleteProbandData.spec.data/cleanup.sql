/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE FROM lab_results WHERE id = 'APISAMPLE_11111';
DELETE FROM questionnaire_instances WHERE user_id = 'qtest-proband1';
DELETE FROM answer_options WHERE id IN (123456, 123457);
DELETE FROM questions WHERE id = 123456;
DELETE FROM questionnaires WHERE id = 123456;
DELETE FROM study_users WHERE user_id = 'qtest-proband1';
DELETE FROM probands WHERE pseudonym IN ('qtest-proband1', 'qtest-deleteme', 'qtest-deleteme_fully');
DELETE FROM studies WHERE name LIKE 'QTest%';
