/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE FROM probands WHERE pseudonym LIKE 'QTest%';
DELETE FROM accounts WHERE username LIKE 'QTest%';
DELETE FROM studies WHERE name LIKE 'ApiTest%';
