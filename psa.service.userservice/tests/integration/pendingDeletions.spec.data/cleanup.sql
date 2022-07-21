/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE
FROM probands
WHERE pseudonym LIKE 'qtest-api%'
   OR pseudonym LIKE '%apitest.de'
   OR pseudonym IN ('qtest-pm_no_email');

DELETE
FROM studies
WHERE name LIKE 'ApiTest%';

DELETE
FROM lab_results
WHERE id = 'APISAMPLE_11111';
DELETE
FROM planned_probands
WHERE user_id IN ('qtest-planned1', 'qtest-planned2');

DELETE FROM pending_deletions;
