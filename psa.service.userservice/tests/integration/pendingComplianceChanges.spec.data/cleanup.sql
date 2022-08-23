/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE
FROM probands
WHERE pseudonym IN
      ('qtest-api-proband1', 'qtest-api-proband2', 'qtest-api-proband3');

DELETE
FROM studies
WHERE name IN ('ApiTestStudie1', 'ApiTestStudie2');

DELETE
FROM questionnaires
WHERE study_id IN ('ApiTestStudie1', 'ApiTestStudie2', 'ApiTestMultiProband', 'ApiTestMultiProf');

