/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DELETE FROM personal_data WHERE pseudonym = 'qtest-proband1';
DELETE FROM pending_deletions WHERE proband_id = 'qtest-proband1';
