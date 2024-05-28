/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

INSERT INTO studies (name)
VALUES ('ApiTestStudie'),
       ('ApiTestStudie2'),
       ('ApiTestMultiProf');

INSERT INTO probands (pseudonym, ids, status, study, origin)
VALUES ('qtest-proband1', 'ids1', 'active', 'ApiTestStudie', 'investigator'),
       ('qtest-proband2', 'ids2', 'active', 'ApiTestStudie2', 'investigator'),
       ('qtest-proband3', 'ids3', 'deactivated', 'ApiTestStudie', 'investigator'),
       ('qtest-proband4', 'ids4', 'active', 'ApiTestStudie', 'investigator');

INSERT INTO users_to_contact(
        id,
        user_id,
        notable_answer_questionnaire_instances,
        is_notable_answer,
        is_notable_answer_at,
        not_filledout_questionnaire_instances,
        is_not_filledout,
        is_not_filledout_at,
        processed,
        processed_at)
VALUES (1, 'qtest-proband1', '{1000,1001,1002,1003}', false, NULL, '{}', true, '2021-05-20T09:34:22.762+02:00', true, '2021-05-20T09:34:22.762+02:00'),
       (2, 'qtest-proband2', '{2000,2001,2002}', true, '2021-05-20T09:34:22.762+02:00', '{2003}', false, NULL, true, '2021-05-20T09:34:22.762+02:00'),
       (3, 'qtest-proband3', '{3000,3001}', false, NULL, '{3002,3003}', true, '2021-05-20T09:34:22.762+02:00', false, NULL),
       (4, 'qtest-proband4', '{4000}', false, NULL, '{4001,4002,4003}', true, '2021-05-20T09:34:22.762+02:00', false, NULL);
