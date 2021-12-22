/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE
FROM accounts
WHERE username IN
      ('ApiTestProband1', 'ApiTestProband2', 'ApiTestProband3', 'forscher1@apitest.de', 'forscher2@apitest.de',
       'ut1@apitest.de', 'ut2@apitest.de', 'pm1@apitest.de', 'pm2@apitest.de', 'pmNoEmail', 'pm4@apitest.de',
       'sa1@apitest.de', 'sa2@apitest.de');

DELETE
FROM probands
WHERE pseudonym IN
      ('ApiTestProband1', 'ApiTestProband2', 'ApiTestProband3');

DELETE
FROM studies
WHERE name IN ('ApiTestStudie1', 'ApiTestStudie2');

DELETE
FROM questionnaires
WHERE study_id IN ('ApiTestStudie1', 'ApiTestStudie2', 'ApiTestMultiProband', 'ApiTestMultiProf');

