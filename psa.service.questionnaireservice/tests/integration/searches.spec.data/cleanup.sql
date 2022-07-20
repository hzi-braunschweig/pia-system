/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE FROM probands WHERE pseudonym LIKE 'qtest-export%';
DELETE FROM probands WHERE pseudonym LIKE 'qtest%';

DELETE
FROM studies
WHERE name IN
      ('ApiTestMultiProbands', 'ApiTestMultiProfs', 'ApiTestStudie', 'ApiTestStudi2', 'ApiTestStudi3', 'ApiTestStudi4',
       'NewApiTestStudie', 'NewApiTestStudie2', 'NewApiTestStudie3', 'NewApiTestStudieChanged', 'ExportTestStudie');
