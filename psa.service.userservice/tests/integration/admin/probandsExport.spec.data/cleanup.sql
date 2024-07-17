/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE
FROM probands
WHERE pseudonym LIKE 'qtest%'
   OR pseudonym LIKE '%@example.com'
   OR study LIKE 'QTest%';

DELETE
FROM studies
WHERE name LIKE 'QTestStudy%'
