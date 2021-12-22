/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

DROP TABLE IF EXISTS user_logs;

ALTER TABLE pending_partial_deletions DROP COLUMN IF EXISTS delete_logs;

DELETE FROM pending_partial_deletions WHERE for_instance_ids IS NULL AND for_lab_results_ids IS NULL;
