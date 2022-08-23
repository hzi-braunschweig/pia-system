/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE FROM probands;

DELETE
FROM studies
WHERE name LIKE 'QTest%';

DELETE
FROM pending_study_changes
WHERE study_id LIKE 'QTest%';
